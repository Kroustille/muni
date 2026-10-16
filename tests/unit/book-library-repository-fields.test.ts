import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { openMuniDb } from "@/adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "@/adapters/indexeddb/item-repository";
import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { BOOK_MOODS, BOOK_PACES, itemToWire, wireToItem } from "@/domain/item";
import { makeItem } from "../helpers/item-repository.contract";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";
import { isoAt, makeServerItemWire } from "../helpers/server-item-wire";

let idbCounter = 0;
const freshIdbName = (): string => `muni-lib-fields-${(idbCounter += 1)}`;

describe("book library field mapping", () => {
  it("round-trips library columns through ItemWire", () => {
    const item = makeItem({
      workId: "OL45804W",
      tags: ["classique", "philosophie"],
      seriesName: "Folio",
      seriesPosition: 2,
      pagesRead: 42,
      loanedTo: "Marie",
      loanedAt: "2026-03-01",
      mood: BOOK_MOODS[0],
      pace: BOOK_PACES[1],
    });
    const wire = itemToWire(item, "2026-01-02T00:00:00.000Z");
    expect(wire.work_id).toBe("OL45804W");
    expect(wire.tags).toEqual(["classique", "philosophie"]);
    expect(wire.series_name).toBe("Folio");
    expect(wire.series_position).toBe(2);
    expect(wire.pages_read).toBe(42);
    expect(wire.loaned_to).toBe("Marie");
    expect(wire.mood).toBe(BOOK_MOODS[0]);
    expect(wireToItem(wire)).toEqual(item);
  });

  it("persists library fields in IndexedDB", async () => {
    const db = await openMuniDb(freshIdbName());
    const repo = createIndexedDbItemRepository(db);
    const item = makeItem({
      tags: ["sf"],
      seriesName: "Dune",
      seriesPosition: 1,
      mood: BOOK_MOODS[2],
      pace: BOOK_PACES[0],
    });
    await repo.put(item, { enqueue: false });
    expect(await repo.get(item.id)).toEqual(item);
    db.close();
  });
});

describe("PostgreSQL library columns", () => {
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
          id: "30000000-0000-4000-8000-000000000001",
          email: "lib-fields@test.local",
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
    const wire = {
      ...makeServerItemWire({
        item: {
          tags: ["classique"],
          seriesName: "Pléiade",
          seriesPosition: 3,
          pagesRead: 10,
          mood: BOOK_MOODS[0],
          pace: BOOK_PACES[2],
          workId: "OL123W",
        },
      }),
      server_updated_at: isoAt(0),
    };
    await items.transaction(async (repo) => {
      await repo.upsert(userId, [wire]);
      const [stored] = await repo.findByIds(userId, [wire.id]);
      expect(stored?.tags).toEqual(["classique"]);
      expect(stored?.series_name).toBe("Pléiade");
      expect(stored?.series_position).toBe(3);
      expect(stored?.pages_read).toBe(10);
      expect(stored?.mood).toBe(BOOK_MOODS[0]);
      expect(stored?.work_id).toBe("OL123W");
      expect(wireToItem(stored!)).toEqual(wireToItem(wire));
    });
  });
});
