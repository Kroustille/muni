import { ensureSearchResultsArray } from "@/application/ensure-search-results-array";
import type { MusicArtistSearchHit, MusicTrackSearchHit } from "@/application/ports/music-catalog-search";

export class MusicCatalogClientError extends Error {
  readonly code: "provider_error" | "unauthorized" | "network" | "missing_query";

  constructor(code: MusicCatalogClientError["code"], message?: string) {
    super(message ?? code);
    this.name = "MusicCatalogClientError";
    this.code = code;
  }
}

export type FetchMusicCatalogDeps = {
  fetch?: typeof fetch;
  baseUrl?: string;
};

async function searchCatalog<T>(
  path: string,
  query: string,
  deps: FetchMusicCatalogDeps,
): Promise<T[]> {
  const fetchFn = deps.fetch ?? fetch;
  const base = deps.baseUrl ?? "";
  const url = `${base}${path}?q=${encodeURIComponent(query)}`;
  let response: Response;
  try {
    response = await fetchFn(url, { credentials: "include" });
  } catch {
    throw new MusicCatalogClientError("network");
  }

  if (response.status === 401) throw new MusicCatalogClientError("unauthorized");
  if (response.status === 400) throw new MusicCatalogClientError("missing_query");
  if (response.status === 502) throw new MusicCatalogClientError("provider_error");
  if (!response.ok) throw new MusicCatalogClientError("network");

  const body = (await response.json()) as { results?: unknown };
  return ensureSearchResultsArray<T>(body.results);
}

export function searchMusicArtistsCatalog(
  query: string,
  deps: FetchMusicCatalogDeps = {},
): Promise<MusicArtistSearchHit[]> {
  return searchCatalog<MusicArtistSearchHit>("/api/music/artists/search", query, deps);
}

export function searchMusicTracksCatalog(
  query: string,
  deps: FetchMusicCatalogDeps = {},
): Promise<MusicTrackSearchHit[]> {
  return searchCatalog<MusicTrackSearchHit>("/api/music/tracks/search", query, deps);
}
