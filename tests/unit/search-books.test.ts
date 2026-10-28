import { describe, expect, it, vi } from "vitest";

import { createSearchBooks } from "@/application/books/search-books";
import type { BookCatalogLookup } from "@/application/ports/book-catalog-lookup";

describe("searchBooks use case", () => {
  const catalog: BookCatalogLookup = {
    lookupByIsbn: vi.fn(),
    searchByTitle: vi.fn(),
  };

  it("returns empty results for blank queries without calling the catalog", async () => {
    const searchBooks = createSearchBooks({ catalog });
    await expect(searchBooks("   ")).resolves.toEqual([]);
    expect(catalog.searchByTitle).not.toHaveBeenCalled();
  });

  it("delegates trimmed title queries to the catalog port", async () => {
    vi.mocked(catalog.searchByTitle).mockResolvedValue([
      { isbn: "9782070368228", title: "Le Petit Prince" },
    ]);
    const searchBooks = createSearchBooks({ catalog });
    await expect(searchBooks("  le petit prince ", 5)).resolves.toHaveLength(1);
    expect(catalog.searchByTitle).toHaveBeenCalledWith("petit prince", 5);
    expect(catalog.lookupByIsbn).not.toHaveBeenCalled();
  });

  it("uses lookupByIsbn when the query is a valid ISBN", async () => {
    vi.mocked(catalog.lookupByIsbn).mockResolvedValue({
      isbn: "9782070368228",
      title: "Le Petit Prince",
    });
    const searchBooks = createSearchBooks({ catalog });
    await expect(searchBooks("978-2-07-036822-8")).resolves.toHaveLength(1);
    expect(catalog.lookupByIsbn).toHaveBeenCalledWith("9782070368228");
    expect(catalog.searchByTitle).not.toHaveBeenCalled();
  });

  it("returns empty results when ISBN lookup misses", async () => {
    vi.mocked(catalog.lookupByIsbn).mockResolvedValue(null);
    const searchBooks = createSearchBooks({ catalog });
    await expect(searchBooks("9782070368228")).resolves.toEqual([]);
  });
});
