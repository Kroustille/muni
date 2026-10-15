import { describe, expect, it } from "vitest";

import { ensureSearchResultsArray } from "@/domain/ensure-search-results-array";

describe("ensureSearchResultsArray", () => {
  it("returns arrays unchanged", () => {
    const hits = [{ id: "1" }];
    expect(ensureSearchResultsArray(hits)).toEqual(hits);
  });

  it("parses JSON string arrays", () => {
    const hits = [{ name: "Artist" }];
    expect(ensureSearchResultsArray(JSON.stringify(hits))).toEqual(hits);
  });

  it("returns empty array for objects and invalid values", () => {
    expect(ensureSearchResultsArray({ results: [] })).toEqual([]);
    expect(ensureSearchResultsArray(null)).toEqual([]);
    expect(ensureSearchResultsArray("not-json")).toEqual([]);
  });
});
