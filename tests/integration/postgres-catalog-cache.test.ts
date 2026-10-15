import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresCatalogCacheRepository } from "@/adapters/postgres/catalog-cache-repository";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-06-01T12:00:00.000Z");

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb?.destroy();
});

describe("Postgres catalog cache repository", () => {
  it("round-trips array payloads (search result lists)", async () => {
    const cache = createPostgresCatalogCacheRepository(testDb.db);
    const payload = [
      { isbn: "9782070368228", title: "Le Petit Prince" },
      { isbn: "9780000000001", title: "Other" },
    ];
    await cache.upsert({
      provider: "wikidata",
      cacheKey: "search:amelie:20",
      payload,
      fetchedAt: NOW,
    });

    const loaded = await cache.get("wikidata", "search:amelie:20", NOW);
    expect(loaded).toEqual(payload);
  });

  it("round-trips object payloads (ISBN lookup hits)", async () => {
    const cache = createPostgresCatalogCacheRepository(testDb.db);
    const payload = { isbn: "9782070368228", title: "Cached" };
    await cache.upsert({
      provider: "open_library",
      cacheKey: "9782070368228",
      payload,
      fetchedAt: NOW,
    });

    const loaded = await cache.get("open_library", "9782070368228", NOW);
    expect(loaded).toEqual(payload);
  });
});
