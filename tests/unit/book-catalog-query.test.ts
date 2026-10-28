import { describe, expect, it } from "vitest";

import {
  bookCatalogSearchCacheKey,
  parseBookCatalogSearchQuery,
  prepareBookCatalogTitleSearchQuery,
} from "@/domain/book-catalog-query";

describe("prepareBookCatalogTitleSearchQuery", () => {
  it("strips leading French articles and collapses whitespace", () => {
    expect(prepareBookCatalogTitleSearchQuery("  Le   Petit   Prince  ")).toBe("Petit Prince");
    expect(prepareBookCatalogTitleSearchQuery("L'Étranger")).toBe("Étranger");
    expect(prepareBookCatalogTitleSearchQuery("les Misérables")).toBe("Misérables");
  });
});

describe("parseBookCatalogSearchQuery", () => {
  it("detects ISBN queries and normalizes to ISBN-13", () => {
    expect(parseBookCatalogSearchQuery("978-2-07-036822-8")).toEqual({
      kind: "isbn",
      isbn: "9782070368228",
    });
  });

  it("treats non-ISBN input as title search text", () => {
    expect(parseBookCatalogSearchQuery("  le Dune  ")).toEqual({
      kind: "title",
      searchText: "Dune",
    });
  });
});

describe("bookCatalogSearchCacheKey", () => {
  it("uses accent-insensitive keys for titles", () => {
    expect(bookCatalogSearchCacheKey("Étranger", 10)).toBe(
      bookCatalogSearchCacheKey("etranger", 10),
    );
  });

  it("uses normalized ISBN for ISBN-shaped queries", () => {
    expect(bookCatalogSearchCacheKey("9782070368228", 5)).toBe("search:9782070368228:5");
  });
});
