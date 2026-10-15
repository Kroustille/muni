import type {
  MovieCatalogDetail,
  MovieCatalogSearch,
  MovieSearchHit,
} from "@/application/ports/movie-catalog-search";

export type SearchMoviesDeps = {
  catalog: MovieCatalogSearch;
};

export type SearchMovies = (query: string, limit?: number) => Promise<MovieSearchHit[]>;

export type FetchMovieCatalogDetail = (wikidataId: string) => Promise<MovieCatalogDetail | null>;

export function createSearchMovies(deps: SearchMoviesDeps): SearchMovies {
  return async (query: string, limit?: number) => {
    const trimmed = query.trim();
    if (trimmed === "") return [];
    return deps.catalog.searchByTitle(trimmed, limit);
  };
}

export function createFetchMovieCatalogDetail(deps: SearchMoviesDeps): FetchMovieCatalogDetail {
  return (wikidataId: string) => deps.catalog.getDetail(wikidataId);
}
