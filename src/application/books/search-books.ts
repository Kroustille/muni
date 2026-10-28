import type { BookCatalogHit, BookCatalogLookup } from "@/application/ports/book-catalog-lookup";
import { parseBookCatalogSearchQuery } from "@/domain/book-catalog-query";

export type SearchBooksDeps = {
  catalog: BookCatalogLookup;
};

export type SearchBooks = (query: string, limit?: number) => Promise<BookCatalogHit[]>;

export function createSearchBooks(deps: SearchBooksDeps): SearchBooks {
  return async (query: string, limit?: number) => {
    const trimmed = query.trim();
    if (trimmed === "") return [];

    const parsed = parseBookCatalogSearchQuery(trimmed);
    if (parsed.kind === "isbn") {
      const hit = await deps.catalog.lookupByIsbn(parsed.isbn);
      return hit ? [hit] : [];
    }

    return deps.catalog.searchByTitle(parsed.searchText, limit);
  };
}
