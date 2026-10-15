import { describe, expect, it } from "vitest";

import {
  CATALOG_CACHE_TTL_MS,
  isCatalogCacheEntryFresh,
} from "@/application/ports/catalog-cache-repository";

const FETCHED = new Date("2026-01-01T12:00:00.000Z");

describe("isCatalogCacheEntryFresh", () => {
  it("is fresh before TTL elapses", () => {
    const now = new Date(FETCHED.getTime() + CATALOG_CACHE_TTL_MS - 1);
    expect(isCatalogCacheEntryFresh(FETCHED, now)).toBe(true);
  });

  it("is stale at or after TTL", () => {
    const atTtl = new Date(FETCHED.getTime() + CATALOG_CACHE_TTL_MS);
    const afterTtl = new Date(FETCHED.getTime() + CATALOG_CACHE_TTL_MS + 1);
    expect(isCatalogCacheEntryFresh(FETCHED, atTtl)).toBe(false);
    expect(isCatalogCacheEntryFresh(FETCHED, afterTtl)).toBe(false);
  });
});
