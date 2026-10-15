import { ensureSearchResultsArray } from "@/domain/ensure-search-results-array";
import type { MovieCatalogDetail, MovieSearchHit } from "@/application/ports/movie-catalog-search";

export class MovieCatalogClientError extends Error {
  readonly code: "not_found" | "provider_error" | "unauthorized" | "network" | "missing_query";

  constructor(code: MovieCatalogClientError["code"], message?: string) {
    super(message ?? code);
    this.name = "MovieCatalogClientError";
    this.code = code;
  }
}

export type FetchMovieCatalogDeps = {
  fetch?: typeof fetch;
  baseUrl?: string;
};

export async function searchMoviesCatalog(
  query: string,
  deps: FetchMovieCatalogDeps = {},
): Promise<MovieSearchHit[]> {
  const fetchFn = deps.fetch ?? fetch;
  const base = deps.baseUrl ?? "";
  const url = `${base}/api/movies/search?q=${encodeURIComponent(query)}`;
  let response: Response;
  try {
    response = await fetchFn(url, { credentials: "include" });
  } catch {
    throw new MovieCatalogClientError("network");
  }

  if (response.status === 401) throw new MovieCatalogClientError("unauthorized");
  if (response.status === 400) throw new MovieCatalogClientError("missing_query");
  if (response.status === 502) throw new MovieCatalogClientError("provider_error");
  if (!response.ok) throw new MovieCatalogClientError("network");

  const body = (await response.json()) as { results?: unknown };
  return ensureSearchResultsArray<MovieSearchHit>(body.results);
}

export async function fetchMovieCatalogDetail(
  wikidataId: string,
  deps: FetchMovieCatalogDeps = {},
): Promise<MovieCatalogDetail> {
  const fetchFn = deps.fetch ?? fetch;
  const base = deps.baseUrl ?? "";
  const url = `${base}/api/movies/entity?id=${encodeURIComponent(wikidataId)}`;
  let response: Response;
  try {
    response = await fetchFn(url, { credentials: "include" });
  } catch {
    throw new MovieCatalogClientError("network");
  }

  if (response.status === 401) throw new MovieCatalogClientError("unauthorized");
  if (response.status === 404) throw new MovieCatalogClientError("not_found");
  if (response.status === 502) throw new MovieCatalogClientError("provider_error");
  if (!response.ok) throw new MovieCatalogClientError("network");

  return (await response.json()) as MovieCatalogDetail;
}
