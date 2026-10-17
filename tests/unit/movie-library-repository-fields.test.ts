import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { openMuniDb } from "@/adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "@/adapters/indexeddb/item-repository";
import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { MOVIE_MOODS, MOVIE_PACES, itemToWire, wireToItem } from "@/domain/item";
import { makeMovieLibraryItem, makeMovieSeriesItem } from "../helpers/item-fixtures";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";
import { isoAt, makeServerItemWire } from "../helpers/server-item-wire";

let idbCounter = 0;
const freshIdbName = (): string => `muni-movie-lib-fields-${(idbCounter += 1)}`;

describe("movie library field mapping", () => {
  it("round-trips library columns through ItemWire", () => {
    const item = makeMovieLibraryItem({
      tags: ["sci-fi"],
      franchiseName: "Dune",
      franchiseOrder: 1,
      mood: MOVIE_MOODS[0],
      pace: MOVIE_PACES[2],
      imdbId: "tt0087182",
    });
    const wire = itemToWire(item, "2026-01-02T00:00:00.000Z");
    expect(wire.franchise_name).toBe("Dune");
    expect(wire.tags).toEqual(["sci-fi"]);
    expect(wireToItem(wire)).toEqual(item);
  });

  it("round-trips episode progress for series", () => {
    const item = makeMovieSeriesItem({
      episodeProgress: { S1E1: { watchedAt: "2026-02-01" } },
      nextEpisodeKey: "S1E2",
    });
    const wire = itemToWire(item, "2026-01-02T00:00:00.000Z");
    expect(wire.episode_progress).toEqual({ S1E1: { watchedAt: "2026-02-01" } });
    expect(wire.next_episode_key).toBe("S1E2");
    expect(wireToItem(wire)).toEqual(item);
  });

  it("persists library fields in IndexedDB", async () => {
    const db = await openMuniDb(freshIdbName());
    const repo = createIndexedDbItemRepository(db);
    const item = makeMovieSeriesItem({ tags: ["drama"] });
    await repo.put(item, { enqueue: false });
    expect(await repo.get(item.id)).toEqual(item);
    db.close();
  });
});

describe("PostgreSQL movie library columns", () => {
  let testDb: TestDatabase | null = null;
  let userId: string;

  beforeAll(async () => {
    try {
      testDb = await createTestDatabase();
      const users = await import("@/adapters/postgres/user-repository").then((m) =>
        m.createPostgresUserRepository(testDb!.db),
      );
      userId = (
        await users.create({
          id: "30000000-0000-4000-8000-000000000002",
          email: "movie-lib-fields@test.local",
          googleSub: null,
          createdAt: new Date("2026-01-01T12:00:00.000Z"),
        })
      ).id;
    } catch {
      testDb = null;
    }
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("persists library columns on upsert", async (ctx) => {
    if (testDb === null) {
      ctx.skip();
      return;
    }
    const items = createPostgresItemRepository(testDb.db);
    const base = makeMovieSeriesItem({
      franchiseName: "Test saga",
      watchedAt: "2026-03-01",
    });
    const wire = {
      ...makeServerItemWire({ item: base }),
      server_updated_at: isoAt(0),
    };
    await items.transaction(async (repo) => {
      await repo.upsert(userId, [wire]);
      const [stored] = await repo.findByIds(userId, [wire.id]);
      expect(stored?.franchise_name).toBe("Test saga");
      expect(stored?.watched_at).toBe("2026-03-01");
      expect(wireToItem(stored!)).toEqual(wireToItem(wire));
    });
  });
});
