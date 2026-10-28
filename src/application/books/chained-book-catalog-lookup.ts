import type { BookCatalogHit, BookCatalogLookup } from "@/application/ports/book-catalog-lookup";

export type ChainedBookCatalogLookupDeps = {
  primary: BookCatalogLookup;
  fallback?: BookCatalogLookup;
};

export function createChainedBookCatalogLookup(
  deps: ChainedBookCatalogLookupDeps,
): BookCatalogLookup {
  return {
    async lookupByIsbn(isbn: string): Promise<BookCatalogHit | null> {
      const primaryHit = await deps.primary.lookupByIsbn(isbn);
      if (primaryHit !== null) return primaryHit;
      if (deps.fallback) {
        return deps.fallback.lookupByIsbn(isbn);
      }
      return null;
    },

    async searchByTitle(query: string, limit?: number): Promise<BookCatalogHit[]> {
      const primaryHits = await deps.primary.searchByTitle(query, limit);
      if (primaryHits.length > 0) return primaryHits;
      if (deps.fallback) {
        return deps.fallback.searchByTitle(query, limit);
      }
      return [];
    },
  };
}
