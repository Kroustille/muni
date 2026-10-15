import { describe, expect, it, vi } from "vitest";

import {
  BookCatalogHit,
  CatalogLookupError,
  type BookCatalogLookup,
} from "@/application/ports/book-catalog-lookup";
import { createLookupBook } from "@/application/books/lookup-book";

const HIT: BookCatalogHit = {
  isbn: "9782070368228",
  title: "Le Petit Prince",
  author: "Antoine de Saint-Exupéry",
};

function fakeLookup(result: BookCatalogHit | null | Error): BookCatalogLookup {
  return {
    lookupByIsbn: vi.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  };
}

describe("lookupBook use case", () => {
  it("returns a catalog hit for a valid ISBN-13", async () => {
    const catalog = fakeLookup(HIT);
    const lookupBook = createLookupBook({ catalog });
    await expect(lookupBook("9782070368228")).resolves.toEqual(HIT);
    expect(catalog.lookupByIsbn).toHaveBeenCalledWith("9782070368228");
  });

  it("normalizes ISBN-10 before lookup", async () => {
    const catalog = fakeLookup(HIT);
    const lookupBook = createLookupBook({ catalog });
    await lookupBook("0 306 40615 2");
    expect(catalog.lookupByIsbn).toHaveBeenCalledWith("9780306406157");
  });

  it("returns null when the catalog has no match", async () => {
    const catalog = fakeLookup(null);
    const lookupBook = createLookupBook({ catalog });
    await expect(lookupBook("9782070368228")).resolves.toBeNull();
  });

  it("rejects invalid ISBN before calling the catalog", async () => {
    const catalog = fakeLookup(HIT);
    const lookupBook = createLookupBook({ catalog });
    await expect(lookupBook("bad-isbn")).rejects.toThrow(/invalid/i);
    expect(catalog.lookupByIsbn).not.toHaveBeenCalled();
  });

  it("propagates provider errors from the catalog port", async () => {
    const catalog = fakeLookup(new CatalogLookupError("upstream down"));
    const lookupBook = createLookupBook({ catalog });
    await expect(lookupBook("9782070368228")).rejects.toBeInstanceOf(CatalogLookupError);
  });
});
