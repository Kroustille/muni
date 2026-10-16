export type BookCatalogHit = {
  isbn: string;
  title: string;
  author?: string;
  synopsis?: string;
  genres?: string[];
  publicationYear?: number;
  publisher?: string;
  pageCount?: number;
  /** Open Library work key (e.g. OL45804W); tasks refer to this as catalogWorkId. */
  workId?: string;
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
  /** Title search; returns hits with ISBN when Open Library provides one. */
  searchByTitle(query: string, limit?: number): Promise<BookCatalogHit[]>;
}
