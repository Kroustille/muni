import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import type { ServerItemRepository } from "@/application/ports/server-item-repository";
import type { ItemWire } from "@/domain/item";
import { isoAt, makeServerItemWire, testHlc } from "../helpers/server-item-wire";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");

let testDb: TestDatabase;
let items: ServerItemRepository;
let userA: string;
let userB: string;
let idCounter = 0;

const uniqueUserId = (): string =>
  `10000000-0000-4000-8000-${String((idCounter += 1)).padStart(12, "0")}`;

const sharedItemId = "20000000-0000-4000-8000-000000000001";

beforeAll(async () => {
  testDb = await createTestDatabase();
  items = createPostgresItemRepository(testDb.db);
  const users = createPostgresUserRepository(testDb.db);
  userA = (
    await users.create({
      id: uniqueUserId(),
      email: "user-a@items.test",
      googleSub: null,
      createdAt: NOW,
    })
  ).id;
  userB = (
    await users.create({
      id: uniqueUserId(),
      email: "user-b@items.test",
      googleSub: null,
      createdAt: NOW,
    })
  ).id;
});

afterAll(async () => {
  await testDb?.destroy();
});

beforeEach(async () => {
  await testDb.db.deleteFrom("items").execute();
});

function withServerTime(wire: ItemWire, serverUpdatedAt: string): ItemWire {
  return { ...wire, server_updated_at: serverUpdatedAt };
}

describe("PostgreSQL ServerItemRepository", () => {
  describe("upsert and findByIds", () => {
    it("stores a row and returns it inside a transaction", async () => {
      const wire = withServerTime(makeServerItemWire(), isoAt(0));
      await items.transaction(async (repo) => {
        await repo.upsert(userA, [wire]);
        expect(await repo.findByIds(userA, [wire.id])).toEqual([wire]);
      });
    });

    it("omits ids that are not stored for the user", async () => {
      const wire = withServerTime(makeServerItemWire(), isoAt(1_000));
      await items.transaction(async (repo) => {
        await repo.upsert(userA, [wire]);
        expect(await repo.findByIds(userA, [wire.id, sharedItemId])).toEqual([wire]);
      });
    });

    it("requires findByIds to run inside transaction", async () => {
      await expect(items.findByIds(userA, [sharedItemId])).rejects.toThrow();
    });
  });

  describe("listSince", () => {
    it("returns rows in ascending server_updated_at order", async () => {
      const first = withServerTime(makeServerItemWire(), isoAt(2_000));
      const second = withServerTime(makeServerItemWire(), isoAt(3_000));
      const third = withServerTime(makeServerItemWire(), isoAt(4_000));
      await items.upsert(userA, [third, first, second]);

      const page = await items.listSince(userA, null, 10);
      expect(page.map((row) => row.id)).toEqual([first.id, second.id, third.id]);
    });

    it("applies the since cursor and limit", async () => {
      const rows = [0, 1, 2, 3].map((offset) =>
        withServerTime(makeServerItemWire(), isoAt(10_000 + offset * 1_000)),
      );
      await items.upsert(userA, rows);

      const firstPage = await items.listSince(userA, null, 2);
      expect(firstPage).toHaveLength(2);
      expect(firstPage[0].id).toBe(rows[0].id);
      expect(firstPage[1].id).toBe(rows[1].id);

      const cursor = firstPage[1].server_updated_at;
      expect(cursor).not.toBeNull();

      const secondPage = await items.listSince(userA, cursor, 10);
      expect(secondPage.map((row) => row.id)).toEqual([rows[2].id, rows[3].id]);
    });

    it("includes soft-deleted rows", async () => {
      const live = withServerTime(makeServerItemWire(), isoAt(20_000));
      const deleted = withServerTime(
        makeServerItemWire({
          patch: {
            deletedAt: isoAt(21_000),
            fieldsUpdatedAt: { deleted_at: testHlc(21_000) },
          },
        }),
        isoAt(21_000),
      );
      await items.upsert(userA, [live, deleted]);

      const listed = await items.listSince(userA, null, 10);
      expect(listed.some((row) => row.id === deleted.id && row.deleted_at !== null)).toBe(true);
    });
  });

  describe("transaction", () => {
    it("rolls back writes when the unit of work fails", async () => {
      const wire = withServerTime(makeServerItemWire(), isoAt(30_000));
      await expect(
        items.transaction(async (repo) => {
          await repo.upsert(userA, [wire]);
          throw new Error("abort");
        }),
      ).rejects.toThrow("abort");

      expect(await items.listSince(userA, null, 10)).toEqual([]);
    });
  });

  describe("two-user isolation", () => {
    it("lets the same item id exist independently per user", async () => {
      const forA = withServerTime(
        makeServerItemWire({
          id: sharedItemId,
          item: { title: "User A copy", type: "shopping", status: null, checked: false },
        }),
        isoAt(40_000),
      );
      const forB = withServerTime(
        makeServerItemWire({
          id: sharedItemId,
          item: { title: "User B copy", type: "movie", status: "to_watch" },
        }),
        isoAt(41_000),
      );

      await items.upsert(userA, [forA]);
      await items.upsert(userB, [forB]);

      expect(await items.listSince(userA, null, 10)).toEqual([forA]);
      expect(await items.listSince(userB, null, 10)).toEqual([forB]);
    });

    it("scopes findByIds and upsert to the caller user id", async () => {
      const forA = withServerTime(
        makeServerItemWire({ id: sharedItemId, item: { title: "Scoped A" } }),
        isoAt(50_000),
      );
      const forB = withServerTime(
        makeServerItemWire({ id: sharedItemId, item: { title: "Scoped B", type: "shopping", status: null } }),
        isoAt(51_000),
      );

      await items.transaction(async (repo) => {
        await repo.upsert(userA, [forA]);
        await repo.upsert(userB, [forB]);

        expect(await repo.findByIds(userA, [sharedItemId])).toEqual([forA]);
        expect(await repo.findByIds(userB, [sharedItemId])).toEqual([forB]);
      });

      await items.transaction(async (repo) => {
        await repo.upsert(userA, [
          withServerTime(
            { ...forA, title: "Mutated only for A", fields_updated_at: { title: testHlc(52_000) } },
            isoAt(52_000),
          ),
        ]);
      });

      expect((await items.listSince(userA, null, 10))[0]?.title).toBe("Mutated only for A");
      expect((await items.listSince(userB, null, 10))[0]?.title).toBe("Scoped B");
    });

    it("never returns another user's rows from listSince", async () => {
      const onlyB = withServerTime(makeServerItemWire({ item: { title: "B exclusive" } }), isoAt(60_000));
      await items.upsert(userB, [onlyB]);

      expect(await items.listSince(userA, null, 10)).toEqual([]);
      expect(await items.listSince(userB, null, 10)).toEqual([onlyB]);
    });
  });

  describe("concurrency", () => {
    it("converges concurrent upserts of the same item to a single row", async () => {
      const base = makeServerItemWire({ id: sharedItemId, item: { type: "shopping", status: null } });
      await items.upsert(userA, [withServerTime({ ...base, title: "seed" }, isoAt(70_000))]);

      await Promise.all(
        Array.from({ length: 20 }, (_, index) =>
          items.transaction(async (repo) => {
            const [current] = await repo.findByIds(userA, [sharedItemId]);
            const nextTitle = `push-${index}`;
            await repo.upsert(userA, [
              withServerTime(
                {
                  ...(current ?? withServerTime(base, isoAt(70_000))),
                  title: nextTitle,
                  fields_updated_at: { title: testHlc(71_000 + index) },
                },
                isoAt(71_000 + index),
              ),
            ]);
          }),
        ),
      );

      const listed = await items.listSince(userA, null, 10);
      expect(listed.filter((row) => row.id === sharedItemId)).toHaveLength(1);
    });
  });
});
