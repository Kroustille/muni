import { describe, expect, it } from "vitest";

import {
  CATALOG_CACHE_TTL_MS,
  isCatalogCacheFresh,
} from "@/application/catalog-cache/ttl";

import { InMemoryCatalogCacheRepository } from "../helpers/in-memory-catalog-cache-repository";

describe("catalog cache TTL", () => {
  const t0 = new Date("2026-01-01T12:00:00.000Z");

  it("uses a 24h TTL per research.md", () => {
    expect(CATALOG_CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("treats entries younger than TTL as fresh", () => {
    const fetchedAt = new Date(t0.getTime() - CATALOG_CACHE_TTL_MS + 1);
    expect(isCatalogCacheFresh(fetchedAt, t0)).toBe(true);
  });

  it("treats entries at or beyond TTL as stale", () => {
    const atTtl = new Date(t0.getTime() - CATALOG_CACHE_TTL_MS);
    expect(isCatalogCacheFresh(atTtl, t0)).toBe(false);

    const older = new Date(t0.getTime() - CATALOG_CACHE_TTL_MS - 1);
    expect(isCatalogCacheFresh(older, t0)).toBe(false);
  });
});

describe("CatalogCacheRepository TTL (in-memory)", () => {
  const provider = "open_library" as const;
  const cacheKey = "9782070368228";
  const payload = { title: "Le Petit Prince" };

  it("returns null when no row exists", async () => {
    const repo = new InMemoryCatalogCacheRepository();
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(await repo.get(provider, cacheKey, now)).toBeNull();
  });

  it("returns payload while the entry is within TTL", async () => {
    const repo = new InMemoryCatalogCacheRepository();
    const fetchedAt = new Date("2026-06-01T00:00:00.000Z");
    await repo.upsert({ provider, cacheKey, payload, fetchedAt });

    const now = new Date(fetchedAt.getTime() + CATALOG_CACHE_TTL_MS - 1);
    expect(await repo.get(provider, cacheKey, now)).toEqual(payload);
  });

  it("returns null after TTL expires", async () => {
    const repo = new InMemoryCatalogCacheRepository();
    const fetchedAt = new Date("2026-06-01T00:00:00.000Z");
    await repo.upsert({ provider, cacheKey, payload, fetchedAt });

    const now = new Date(fetchedAt.getTime() + CATALOG_CACHE_TTL_MS);
    expect(await repo.get(provider, cacheKey, now)).toBeNull();
  });

  it("scopes entries by provider and cache key", async () => {
    const repo = new InMemoryCatalogCacheRepository();
    const fetchedAt = new Date("2026-06-01T00:00:00.000Z");
    await repo.upsert({ provider, cacheKey, payload, fetchedAt });

    expect(await repo.get(provider, "9780000000000", fetchedAt)).toBeNull();
  });

  it("replaces payload and fetchedAt on upsert", async () => {
    const repo = new InMemoryCatalogCacheRepository();
    const firstAt = new Date("2026-06-01T00:00:00.000Z");
    await repo.upsert({ provider, cacheKey, payload: { title: "A" }, fetchedAt: firstAt });

    const secondAt = new Date("2026-06-15T00:00:00.000Z");
    const updated = { title: "B" };
    await repo.upsert({ provider, cacheKey, payload: updated, fetchedAt: secondAt });

    const staleRelativeToRefresh = new Date(secondAt.getTime() + CATALOG_CACHE_TTL_MS - 1);
    expect(await repo.get(provider, cacheKey, staleRelativeToRefresh)).toEqual(updated);

    const expiredAfterFirstButBeforeSecondTtl = new Date(firstAt.getTime() + CATALOG_CACHE_TTL_MS + 1);
    expect(await repo.get(provider, cacheKey, expiredAfterFirstButBeforeSecondTtl)).toEqual(
      updated,
    );
  });
});
