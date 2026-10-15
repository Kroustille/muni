import type { BookCatalogHit, BookCatalogLookup } from "@/application/ports/book-catalog-lookup";

export type SearchBooksDeps = {
  catalog: BookCatalogLookup;
};

export type SearchBooks = (query: string, limit?: number) => Promise<BookCatalogHit[]>;

export function createSearchBooks(deps: SearchBooksDeps): SearchBooks {
  return async (query: string, limit?: number) => {
    const trimmed = query.trim();
    if (trimmed === "") return [];
    return deps.catalog.searchByTitle(trimmed, limit);
  };
}
