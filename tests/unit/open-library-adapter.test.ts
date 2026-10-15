import { describe, expect, it, vi } from "vitest";

import { CatalogLookupError } from "@/application/ports/book-catalog-lookup";
import { createOpenLibraryBookCatalogLookup } from "@/adapters/open-library/book-catalog-lookup";
import { InMemoryCatalogCacheRepository } from "../helpers/in-memory-catalog-cache-repository";

const API_BASE = "https://openlibrary.test";
const ISBN = "9782070368228";

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Open Library BookCatalogLookup adapter", () => {
  it("returns null when the edition is not found", async () => {
    const fetch = vi.fn(async () => new Response("", { status: 404 }));
    const lookup = createOpenLibraryBookCatalogLookup({ fetch, apiBase: API_BASE });
    expect(await lookup.lookupByIsbn(ISBN)).toBeNull();
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/isbn/${ISBN}.json`);
  });

  it("maps edition, author, and work payloads to BookCatalogHit", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === `${API_BASE}/isbn/${ISBN}.json`) {
        return jsonResponse({
          title: "Le Petit Prince",
          publishers: [" Gallimard "],
          number_of_pages: 96,
          publish_date: "1943",
          authors: [{ key: "/authors/OL123A" }],
          works: [{ key: "/works/OL456W" }],
        });
      }
      if (url === `${API_BASE}/authors/OL123A.json`) {
        return jsonResponse({ name: "Antoine de Saint-Exupéry" });
      }
      if (url === `${API_BASE}/works/OL456W.json`) {
        return jsonResponse({
          description: { type: "/type/text", value: "  A pilot meets a prince.  " },
          subjects: ["/subjects/Children's_fiction", "French literature"],
        });
      }
      return new Response("missing", { status: 404 });
    });

    const lookup = createOpenLibraryBookCatalogLookup({ fetch, apiBase: API_BASE });
    await expect(lookup.lookupByIsbn(ISBN)).resolves.toEqual({
      isbn: ISBN,
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
      synopsis: "A pilot meets a prince.",
      genres: ["Children's_fiction", "French literature"],
      publicationYear: 1943,
      publisher: "Gallimard",
      pageCount: 96,
    });
  });

  it("returns null when the edition has no title", async () => {
    const fetch = vi.fn(async () => jsonResponse({ publishers: ["X"] }));
    const lookup = createOpenLibraryBookCatalogLookup({ fetch, apiBase: API_BASE });
    expect(await lookup.lookupByIsbn(ISBN)).toBeNull();
  });

  it("throws CatalogLookupError on provider HTTP errors", async () => {
    const fetch = vi.fn(async () => new Response("error", { status: 500 }));
    const lookup = createOpenLibraryBookCatalogLookup({ fetch, apiBase: API_BASE });
    await expect(lookup.lookupByIsbn(ISBN)).rejects.toBeInstanceOf(CatalogLookupError);
  });

  it("serves fresh cache hits without calling Open Library", async () => {
    const fetch = vi.fn(async () => jsonResponse({ title: "Unexpected fetch" }));
    const cache = new InMemoryCatalogCacheRepository();
    const now = new Date("2026-06-01T00:00:00.000Z");
    await cache.upsert({
      provider: "open_library",
      cacheKey: ISBN,
      payload: { isbn: ISBN, title: "Cached title" },
      fetchedAt: now,
    });

    const lookup = createOpenLibraryBookCatalogLookup({
      fetch,
      apiBase: API_BASE,
      cache,
      now: () => now,
    });

    await expect(lookup.lookupByIsbn(ISBN)).resolves.toEqual({
      isbn: ISBN,
      title: "Cached title",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
