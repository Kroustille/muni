import { describe, expect, it, vi } from "vitest";

import { createChainedBookCatalogLookup } from "@/application/books/chained-book-catalog-lookup";
import type { BookCatalogHit, BookCatalogLookup } from "@/application/ports/book-catalog-lookup";
import { createOpenLibraryBookCatalogLookup } from "@/adapters/open-library/book-catalog-lookup";

const SAMPLE_HIT: BookCatalogHit = {
  isbn: "9782070368228",
  title: "Le Petit Prince",
  author: "Antoine de Saint-Exupéry",
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("chained book catalog lookup (OL primary, stub fallback)", () => {
  it("returns the primary hit without calling fallback", async () => {
    const primary: BookCatalogLookup = {
      lookupByIsbn: vi.fn(async () => SAMPLE_HIT),
      searchByTitle: vi.fn(async () => [SAMPLE_HIT]),
    };
    const fallback: BookCatalogLookup = {
      lookupByIsbn: vi.fn(async () => ({ isbn: "999", title: "Fallback" })),
      searchByTitle: vi.fn(async () => [{ isbn: "999", title: "Fallback" }]),
    };

    const catalog = createChainedBookCatalogLookup({ primary, fallback });
    await expect(catalog.lookupByIsbn("9782070368228")).resolves.toEqual(SAMPLE_HIT);
    await expect(catalog.searchByTitle("petit prince")).resolves.toEqual([SAMPLE_HIT]);
    expect(fallback.lookupByIsbn).not.toHaveBeenCalled();
    expect(fallback.searchByTitle).not.toHaveBeenCalled();
  });

  it("delegates to fallback when Open Library returns empty", async () => {
    const primaryFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/isbn/")) return new Response("", { status: 404 });
      if (url.includes("/search.json")) {
        return jsonResponse({ docs: [] });
      }
      return new Response("missing", { status: 404 });
    });
    const primary = createOpenLibraryBookCatalogLookup({
      fetch: primaryFetch,
      apiBase: "https://openlibrary.test",
    });

    const fallbackHit: BookCatalogHit = { isbn: "9780000000001", title: "Stubbed title" };
    const fallback: BookCatalogLookup = {
      lookupByIsbn: vi.fn(async () => fallbackHit),
      searchByTitle: vi.fn(async () => [fallbackHit]),
    };

    const catalog = createChainedBookCatalogLookup({ primary, fallback });
    await expect(catalog.lookupByIsbn("9782070368228")).resolves.toEqual(fallbackHit);
    await expect(catalog.searchByTitle("introuvable")).resolves.toEqual([fallbackHit]);
    expect(fallback.lookupByIsbn).toHaveBeenCalledOnce();
    expect(fallback.searchByTitle).toHaveBeenCalledOnce();
  });

  it("returns null or empty when no fallback adapter is configured", async () => {
    const primary: BookCatalogLookup = {
      lookupByIsbn: vi.fn(async () => null),
      searchByTitle: vi.fn(async () => []),
    };
    const catalog = createChainedBookCatalogLookup({ primary });
    await expect(catalog.lookupByIsbn("9782070368228")).resolves.toBeNull();
    await expect(catalog.searchByTitle("vide")).resolves.toEqual([]);
  });
});
