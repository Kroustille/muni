import { ensureSearchResultsArray } from "@/application/ensure-search-results-array";
import type { CatalogCacheRepository } from "@/application/ports/catalog-cache-repository";
import {
  MovieCatalogSearch,
  MovieCatalogDetail,
  MovieCatalogSearchError,
  MovieSearchHit,
} from "@/application/ports/movie-catalog-search";

import {
  mapEntitiesResponseToHits,
  mapEntityResponseToDetail,
  mapSearchResponseIds,
} from "./wikidata-movie-mapper";

const DEFAULT_API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "Muni/0.1 (movie catalog; +https://github.com/Kroustille/muni)";

export type WikidataMovieCatalogSearchDeps = {
  fetch?: typeof fetch;
  apiBase?: string;
  cache?: CatalogCacheRepository;
  now?: () => Date;
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function searchCacheKey(query: string, limit: number): string {
  return `search:${normalizeQuery(query)}:${limit}`;
}

function entityCacheKey(wikidataId: string): string {
  return `entity:${wikidataId}`;
}

async function fetchJson<T>(fetchFn: typeof fetch, url: string): Promise<T> {
  const response = await fetchFn(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new MovieCatalogSearchError(`Wikidata request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

function buildUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function createWikidataMovieCatalogSearch(
  deps: WikidataMovieCatalogSearchDeps = {},
): MovieCatalogSearch {
  const fetchFn = deps.fetch ?? fetch;
  const apiBase = deps.apiBase ?? DEFAULT_API;

  return {
    async searchByTitle(query: string, limit = 20): Promise<MovieSearchHit[]> {
      const trimmed = query.trim();
      if (trimmed === "") return [];
      const capped = Math.min(Math.max(1, limit), 20);
      const now = deps.now?.() ?? new Date();
      const cacheKey = searchCacheKey(trimmed, capped);

      if (deps.cache) {
        const cached = await deps.cache.get("wikidata", cacheKey, now);
        if (cached !== null) {
          if (Array.isArray(cached)) return cached as MovieSearchHit[];
          const recovered = ensureSearchResultsArray<MovieSearchHit>(cached);
          if (recovered.length > 0) return recovered;
        }
      }

      let searchPayload: Parameters<typeof mapSearchResponseIds>[0];
      try {
        const searchUrl = buildUrl(apiBase, {
          action: "wbsearchentities",
          search: trimmed,
          language: "fr",
          format: "json",
          type: "item",
          limit: String(capped),
          origin: "*",
        });
        searchPayload = await fetchJson(fetchFn, searchUrl);
      } catch (error) {
        throw error instanceof MovieCatalogSearchError
          ? error
          : new MovieCatalogSearchError("Wikidata search failed", error);
      }

      const ids = mapSearchResponseIds(searchPayload);
      if (ids.length === 0) {
        if (deps.cache) {
          await deps.cache.upsert({
            provider: "wikidata",
            cacheKey,
            payload: [],
            fetchedAt: now,
          });
        }
        return [];
      }

      let entitiesPayload: Parameters<typeof mapEntitiesResponseToHits>[0];
      try {
        const entitiesUrl = buildUrl(apiBase, {
          action: "wbgetentities",
          ids: ids.join("|"),
          props: "labels|descriptions|claims",
          languages: "fr|en",
          format: "json",
          origin: "*",
        });
        entitiesPayload = await fetchJson(fetchFn, entitiesUrl);
      } catch (error) {
        throw error instanceof MovieCatalogSearchError
          ? error
          : new MovieCatalogSearchError("Wikidata entity fetch failed", error);
      }

      const hits = mapEntitiesResponseToHits(entitiesPayload, ids);

      if (deps.cache) {
        await deps.cache.upsert({
          provider: "wikidata",
          cacheKey,
          payload: hits,
          fetchedAt: now,
        });
      }

      return hits;
    },

    async getDetail(wikidataId: string): Promise<MovieCatalogDetail | null> {
      const id = wikidataId.trim();
      if (!/^Q\d+$/.test(id)) return null;
      const now = deps.now?.() ?? new Date();
      const cacheKey = entityCacheKey(id);

      if (deps.cache) {
        const cached = await deps.cache.get("wikidata", cacheKey, now);
        if (cached !== null) {
          return cached as MovieCatalogDetail;
        }
      }

      let entitiesPayload: Parameters<typeof mapEntityResponseToDetail>[0];
      try {
        const entitiesUrl = buildUrl(apiBase, {
          action: "wbgetentities",
          ids: id,
          props: "labels|descriptions|claims",
          languages: "fr|en",
          format: "json",
          origin: "*",
        });
        entitiesPayload = await fetchJson(fetchFn, entitiesUrl);
      } catch (error) {
        throw error instanceof MovieCatalogSearchError
          ? error
          : new MovieCatalogSearchError("Wikidata entity fetch failed", error);
      }

      const detail = mapEntityResponseToDetail(entitiesPayload, id);
      if (detail !== null && deps.cache) {
        await deps.cache.upsert({
          provider: "wikidata",
          cacheKey,
          payload: detail,
          fetchedAt: now,
        });
      }
      return detail;
    },
  };
}
