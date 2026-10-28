import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createPostgresCookbookRepository } from "@/adapters/postgres/cookbook-repository";
import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import {
  createCookbookSyncService,
  validatePushCookbooks,
} from "@/application/server/cookbook-sync-service";
import { createSyncService } from "@/application/server/sync-service";
import { cookbookToWire, newCookbook } from "@/domain/cookbook";
import { itemToWire, newItem } from "@/domain/item";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");
const COOKBOOK_A = "70000000-0000-4000-8000-000000000001";
const COOKBOOK_B = "70000000-0000-4000-8000-000000000002";
const RECIPE_A = "60000000-0000-4000-8000-000000000001";

let testDb: TestDatabase | undefined;
let userA: string;
let userB: string;
let idCounter = 0;

const uniqueUserId = (): string =>
  `10000000-0000-4000-8000-${String((idCounter += 1)).padStart(12, "0")}`;

describe("cookbook sync", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userA = (
      await users.create({
        id: uniqueUserId(),
        email: "cookbooks-a@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    userB = (
      await users.create({
        id: uniqueUserId(),
        email: "cookbooks-b@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  beforeEach(async () => {
    if (testDb === undefined) return;
    await testDb.db.deleteFrom("items").execute();
    await testDb.db.deleteFrom("cookbooks").execute();
  });

  it("isolates cookbooks per user on pull", async () => {
    if (testDb === undefined) return;
    const cookbooks = createPostgresCookbookRepository(testDb.db);
    const sync = createCookbookSyncService({ cookbooks, now: () => NOW });

    const bookA = newCookbook({
      id: COOKBOOK_A,
      title: "Livre A",
      createdAt: NOW.toISOString(),
    });
    await sync.push(userA, [cookbookToWire(bookA)]);

    const bookB = newCookbook({
      id: COOKBOOK_B,
      title: "Livre B",
      createdAt: NOW.toISOString(),
    });
    await sync.push(userB, [cookbookToWire(bookB)]);

    const pullA = await sync.pull(userA, null, 100);
    const pullB = await sync.pull(userB, null, 100);

    expect(pullA.cookbooks.map((row) => row.id)).toEqual([COOKBOOK_A]);
    expect(pullB.cookbooks.map((row) => row.id)).toEqual([COOKBOOK_B]);
  });

  it("validates recipe cookbook_id on item push", async () => {
    if (testDb === undefined) return;
    const items = createPostgresItemRepository(testDb.db);
    const cookbooks = createPostgresCookbookRepository(testDb.db);
    const itemSync = createSyncService({ repository: items, cookbooks, now: () => NOW });
    const cookbookSync = createCookbookSyncService({ cookbooks, now: () => NOW });

    const cookbook = newCookbook({
      id: COOKBOOK_A,
      title: "Source",
      createdAt: NOW.toISOString(),
    });
    await cookbookSync.push(userA, [cookbookToWire(cookbook)]);

    const recipe = itemToWire(
      newItem({
        id: RECIPE_A,
        type: "recipe",
        title: "Gateau",
        createdAt: NOW.toISOString(),
        cookbookId: COOKBOOK_A,
        sourcePage: "42",
      }),
      NOW.toISOString(),
    );

    const merged = await itemSync.push(userA, [recipe]);
    expect(merged[0]?.cookbook_id).toBe(COOKBOOK_A);
    expect(merged[0]?.source_page).toBe("42");
  });

  it("rejects orphan source_page on item push", async () => {
    if (testDb === undefined) return;
    const items = createPostgresItemRepository(testDb.db);
    const cookbooks = createPostgresCookbookRepository(testDb.db);
    const itemSync = createSyncService({ repository: items, cookbooks, now: () => NOW });

    const recipe = itemToWire(
      newItem({
        id: RECIPE_A,
        type: "recipe",
        title: "Gateau",
        createdAt: NOW.toISOString(),
      }),
      NOW.toISOString(),
    );
    recipe.source_page = "42";

    await expect(itemSync.push(userA, [recipe])).rejects.toThrow();
  });

  it("merges concurrent cookbook author with per-field LWW", async () => {
    if (testDb === undefined) return;
    const cookbooks = createPostgresCookbookRepository(testDb.db);
    const sync = createCookbookSyncService({ cookbooks, now: () => NOW });

    const base = cookbookToWire(
      newCookbook({ id: COOKBOOK_A, title: "T", createdAt: NOW.toISOString() }),
    );
    await sync.push(userA, [base]);

    const older = {
      ...base,
      author: "Ancien",
      fields_updated_at: { ...base.fields_updated_at, author: "1000-0-device-a" },
    };
    const newer = {
      ...base,
      author: "Nouveau",
      fields_updated_at: { ...base.fields_updated_at, author: "2000-0-device-b" },
    };

    await sync.push(userA, [older]);
    const merged = await sync.push(userA, [newer]);
    expect(merged[0]?.author).toBe("Nouveau");
  });
});

describe("validatePushCookbooks", () => {
  it("rejects user_id on wire rows", () => {
    expect(() =>
      validatePushCookbooks([
        {
          id: COOKBOOK_A,
          user_id: "10000000-0000-4000-8000-000000000099",
          title: "T",
          author: null,
          isbn: null,
          created_at: NOW.toISOString(),
          deleted_at: null,
          fields_updated_at: {},
        },
      ]),
    ).toThrow();
  });
});
