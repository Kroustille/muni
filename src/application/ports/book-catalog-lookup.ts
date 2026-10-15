export type BookCatalogHit = {
  isbn: string;
  title: string;
  author?: string;
  synopsis?: string;
  genres?: string[];
  publicationYear?: number;
  publisher?: string;
  pageCount?: number;
};

export class CatalogLookupError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CatalogLookupError";
    this.cause = cause;
  }
}

export interface BookCatalogLookup {
  /** @param isbn Normalized ISBN-13. */
  lookupByIsbn(isbn: string): Promise<BookCatalogHit | null>;
}
