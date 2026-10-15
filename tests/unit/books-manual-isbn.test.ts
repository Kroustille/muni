import { describe, expect, it, vi } from "vitest";

import {
  BookCatalogLookupClientError,
  fetchBookCatalogHit,
} from "@/application/books/fetch-catalog-hit";

describe("manual ISBN catalog lookup", () => {
  it("uses the same lookup API as scan flow", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        isbn: "9782070368228",
        title: "L'Étranger",
        author: "Camus",
      }),
    });
    const hit = await fetchBookCatalogHit("9782070368228", { fetch: fetchMock, baseUrl: "" });
    expect(hit.title).toBe("L'Étranger");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/books/lookup?isbn=9782070368228",
      { credentials: "include" },
    );
  });

  it("maps not_found for manual entry failure handling", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(
      fetchBookCatalogHit("9780000000000", { fetch: fetchMock }),
    ).rejects.toMatchObject({ code: "not_found" satisfies BookCatalogLookupClientError["code"] });
  });
});
