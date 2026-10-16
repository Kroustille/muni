import type { MediaKind } from "@/domain/item";

export type MovieSearchHit = {
  wikidataId: string;
  title: string;
  releaseYear?: number;
  imdbId?: string;
  mediaKind: MediaKind;
  catalogRating?: number;
};

export type MovieCatalogDetail = MovieSearchHit & {
  synopsis?: string;
  director?: string;
  cast?: string[];
};

export class MovieCatalogSearchError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MovieCatalogSearchError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export interface MovieCatalogSearch {
  searchByTitle(query: string, limit?: number): Promise<MovieSearchHit[]>;
  getDetail(wikidataId: string): Promise<MovieCatalogDetail | null>;
}
