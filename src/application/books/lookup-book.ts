import type { BookCatalogHit, BookCatalogLookup } from "@/application/ports/book-catalog-lookup";
import { normalizeIsbn } from "@/domain/isbn";

export type LookupBookDeps = {
  catalog: BookCatalogLookup;
};

export type LookupBook = (rawIsbn: string) => Promise<BookCatalogHit | null>;

export function createLookupBook(deps: LookupBookDeps): LookupBook {
  return async (rawIsbn: string) => {
    const isbn = normalizeIsbn(rawIsbn);
    return deps.catalog.lookupByIsbn(isbn);
  };
}
