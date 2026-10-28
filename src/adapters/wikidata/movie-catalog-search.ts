import { ensureSearchResultsArray } from "@/domain/ensure-search-results-array";
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
const MAX_SEARCH_ROUNDS = 4;
const MAX_ENTITY_IDS_PER_REQUEST = 50;
const MAX_SEARCH_BATCH = 50;

export type WikidataMovieCatalogSearchDeps = {
  fetch?: typeof fetch;
  apiBase?: string;
  cache?: CatalogCacheRepository;
  now?: () => Date;
};

type WikidataSearchPayload = Parameters<typeof mapSearchResponseIds>[0] & {
  "search-continue"?: number;
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

/** Shared French-first params for wbsearchentities (exported for tests). */
export function buildWikidataEntitySearchParams(
  query: string,
  limit: number,
  continueOffset?: number,
): Record<string, string> {
  const params: Record<string, string> = {
    action: "wbsearchentities",
    search: query,
    language: "fr",
    uselang: "fr",
    format: "json",
    type: "item",
    limit: String(Math.min(Math.max(1, limit), MAX_SEARCH_BATCH)),
    origin: "*",
  };
  if (continueOffset !== undefined) {
    params.continue = String(continueOffset);
  }
  return params;
}

/** French-first entity fetch params (exported for tests). */
export function buildWikidataGetEntitiesParams(ids: string[]): Record<string, string> {
  return {
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "labels|descriptions|claims",
    languages: "fr|en",
    language: "fr",
    uselang: "fr",
    format: "json",
    origin: "*",
  };
}

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

async function collectSearchIds(
  fetchFn: typeof fetch,
  apiBase: string,
  query: string,
  minimumIds: number,
): Promise<string[]> {
  const collected: string[] = [];
  let continueOffset: number | undefined;

  for (let round = 0; round < MAX_SEARCH_ROUNDS && collected.length < minimumIds; round += 1) {
    const batchSize = Math.min(
      MAX_SEARCH_BATCH,
      Math.max(minimumIds - collected.length, 20),
    );
    const searchUrl = buildUrl(
      apiBase,
      buildWikidataEntitySearchParams(query, batchSize, continueOffset),
    );
    const searchPayload = await fetchJson<WikidataSearchPayload>(fetchFn, searchUrl);
    const ids = mapSearchResponseIds(searchPayload);
    for (const id of ids) {
      if (!collected.includes(id)) collected.push(id);
    }
    const nextContinue = searchPayload["search-continue"];
    if (nextContinue === undefined || ids.length === 0) break;
    continueOffset = nextContinue;
  }

  return collected;
}

async function mapIdsToHits(
  fetchFn: typeof fetch,
  apiBase: string,
  ids: string[],
  limit: number,
): Promise<MovieSearchHit[]> {
  const hits: MovieSearchHit[] = [];
  const seen = new Set<string>();

  for (const chunk of chunkIds(ids, MAX_ENTITY_IDS_PER_REQUEST)) {
    const entitiesUrl = buildUrl(apiBase, buildWikidataGetEntitiesParams(chunk));
    const entitiesPayload = await fetchJson<Parameters<typeof mapEntitiesResponseToHits>[0]>(
      fetchFn,
      entitiesUrl,
    );
    for (const hit of mapEntitiesResponseToHits(entitiesPayload, chunk)) {
      if (seen.has(hit.wikidataId)) continue;
      seen.add(hit.wikidataId);
      hits.push(hit);
      if (hits.length >= limit) return hits;
    }
  }

  return hits;
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

      let hits: MovieSearchHit[];
      try {
        const minimumIds = Math.min(capped * 3, MAX_SEARCH_BATCH * MAX_SEARCH_ROUNDS);
        const ids = await collectSearchIds(fetchFn, apiBase, trimmed, minimumIds);
        if (ids.length === 0) {
          hits = [];
        } else {
          hits = await mapIdsToHits(fetchFn, apiBase, ids, capped);
        }
      } catch (error) {
        throw error instanceof MovieCatalogSearchError
          ? error
          : new MovieCatalogSearchError("Wikidata search failed", error);
      }

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
        const entitiesUrl = buildUrl(apiBase, buildWikidataGetEntitiesParams([id]));
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
