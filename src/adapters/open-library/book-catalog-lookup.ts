import { ensureSearchResultsArray } from "@/application/ensure-search-results-array";
import {
  BookCatalogLookup,
  BookCatalogHit,
  CatalogLookupError,
} from "@/application/ports/book-catalog-lookup";
import type { CatalogCacheRepository } from "@/application/ports/catalog-cache-repository";

import {
  mapSearchResponseToHits,
  type OpenLibrarySearchResponse,
} from "./open-library-search-mapper";

type OpenLibraryEdition = {
  title?: string;
  publishers?: string[];
  number_of_pages?: number;
  publish_date?: string;
  authors?: { key: string }[];
  works?: { key: string }[];
  subjects?: string[];
};

type OpenLibraryAuthor = {
  name?: string;
};

type OpenLibraryWork = {
  description?: string | { type?: string; value?: string };
  subjects?: string[];
};

export type OpenLibraryBookCatalogLookupDeps = {
  fetch?: typeof fetch;
  apiBase?: string;
  cache?: CatalogCacheRepository;
  now?: () => Date;
};

function parsePublicationYear(publishDate: unknown): number | undefined {
  if (typeof publishDate !== "string") return undefined;
  const match = publishDate.match(/\d{4}/);
  if (!match) return undefined;
  const year = Number(match[0]);
  if (year < 1000 || year > 2100) return undefined;
  return year;
}

function readDescription(description: OpenLibraryWork["description"]): string | undefined {
  if (typeof description === "string") {
    const trimmed = description.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (description && typeof description.value === "string") {
    const trimmed = description.value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return undefined;
}

function normalizeSubjects(subjects: unknown): string[] | undefined {
  if (!Array.isArray(subjects)) return undefined;
  const labels = subjects
    .map((entry) => {
      if (typeof entry === "string") return entry.replace(/^\/subjects\//, "");
      return null;
    })
    .filter((value): value is string => value !== null && value.trim() !== "");
  return labels.length === 0 ? undefined : labels;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function searchCacheKey(query: string, limit: number): string {
  return `search:${normalizeQuery(query)}:${limit}`;
}

async function fetchJson<T>(
  fetchFn: typeof fetch,
  url: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetchFn(url);
  if (response.status === 404) {
    return { ok: false, status: 404 };
  }
  if (!response.ok) {
    throw new CatalogLookupError(`Open Library request failed (${response.status}) for ${url}`);
  }
  return { ok: true, data: (await response.json()) as T };
}

export function createOpenLibraryBookCatalogLookup(
  deps: OpenLibraryBookCatalogLookupDeps = {},
): BookCatalogLookup {
  const fetchFn = deps.fetch ?? fetch;
  const apiBase = deps.apiBase ?? "https://openlibrary.org";

  return {
    async lookupByIsbn(isbn: string): Promise<BookCatalogHit | null> {
      const now = deps.now?.() ?? new Date();
      if (deps.cache) {
        const cached = await deps.cache.get("open_library", isbn, now);
        if (cached !== null) {
          return cached as BookCatalogHit;
        }
      }

      const editionUrl = `${apiBase}/isbn/${encodeURIComponent(isbn)}.json`;
      let editionResult: { ok: true; data: OpenLibraryEdition } | { ok: false; status: number };
      try {
        editionResult = await fetchJson<OpenLibraryEdition>(fetchFn, editionUrl);
      } catch (error) {
        throw error instanceof CatalogLookupError
          ? error
          : new CatalogLookupError("Open Library lookup failed", error);
      }

      if (!editionResult.ok) {
        return editionResult.status === 404 ? null : null;
      }

      const edition = editionResult.data;
      const title = edition.title?.trim();
      if (!title) {
        return null;
      }

      const authorNames: string[] = [];
      for (const authorRef of edition.authors ?? []) {
        const authorUrl = `${apiBase}${authorRef.key}.json`;
        const authorResult = await fetchJson<OpenLibraryAuthor>(fetchFn, authorUrl);
        if (authorResult.ok && authorResult.data.name?.trim()) {
          authorNames.push(authorResult.data.name.trim());
        }
      }

      let synopsis: string | undefined;
      let genres = normalizeSubjects(edition.subjects);

      const workKey = edition.works?.[0]?.key;
      if (workKey) {
        const workResult = await fetchJson<OpenLibraryWork>(fetchFn, `${apiBase}${workKey}.json`);
        if (workResult.ok) {
          synopsis = readDescription(workResult.data.description);
          genres ??= normalizeSubjects(workResult.data.subjects);
        }
      }

      const publisher = edition.publishers?.[0]?.trim();
      const pageCount =
        typeof edition.number_of_pages === "number" && edition.number_of_pages >= 1
          ? edition.number_of_pages
          : undefined;

      const hit: BookCatalogHit = {
        isbn,
        title,
      };
      if (authorNames.length > 0) hit.author = authorNames.join(", ");
      if (synopsis) hit.synopsis = synopsis;
      if (genres) hit.genres = genres;
      const publicationYear = parsePublicationYear(edition.publish_date);
      if (publicationYear !== undefined) hit.publicationYear = publicationYear;
      if (publisher) hit.publisher = publisher;
      if (pageCount !== undefined) hit.pageCount = pageCount;

      if (hit && deps.cache) {
        await deps.cache.upsert({
          provider: "open_library",
          cacheKey: isbn,
          payload: hit,
          fetchedAt: now,
        });
      }

      return hit;
    },

    async searchByTitle(query: string, limit = 20): Promise<BookCatalogHit[]> {
      const trimmed = query.trim();
      if (trimmed === "") return [];
      const capped = Math.min(Math.max(1, limit), 20);
      const now = deps.now?.() ?? new Date();
      const cacheKey = searchCacheKey(trimmed, capped);

      if (deps.cache) {
        const cached = await deps.cache.get("open_library", cacheKey, now);
        if (cached !== null) {
          if (Array.isArray(cached)) return cached as BookCatalogHit[];
          const recovered = ensureSearchResultsArray<BookCatalogHit>(cached);
          if (recovered.length > 0) return recovered;
        }
      }

      const searchUrl = `${apiBase}/search.json?q=${encodeURIComponent(trimmed)}&limit=${capped}`;
      let searchPayload: OpenLibrarySearchResponse;
      try {
        const result = await fetchJson<OpenLibrarySearchResponse>(fetchFn, searchUrl);
        if (!result.ok) {
          throw new CatalogLookupError(
            `Open Library search failed (${result.status}) for ${searchUrl}`,
          );
        }
        searchPayload = result.data;
      } catch (error) {
        throw error instanceof CatalogLookupError
          ? error
          : new CatalogLookupError("Open Library search failed", error);
      }

      const hits = mapSearchResponseToHits(searchPayload, capped);

      if (deps.cache) {
        await deps.cache.upsert({
          provider: "open_library",
          cacheKey,
          payload: hits,
          fetchedAt: now,
        });
      }

      return hits;
    },
  };
}
