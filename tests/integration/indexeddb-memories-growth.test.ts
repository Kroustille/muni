import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";

import { openMuniDb } from "@/adapters/indexeddb/db";
import { createIndexedDbMemoriesGrowthStores } from "@/adapters/indexeddb/memories-growth-repositories";
import { buildAchievement, buildSouvenir } from "../unit/memories-growth/fixtures";

let counter = 0;
const freshName = () => `muni-memories-${Date.now()}-${counter++}`;

describe("IndexedDB memories & growth stores", () => {
  it("upserts, lists without tombstones, and tracks the outbox", async () => {
    const db = await openMuniDb(freshName());
    const { souvenirs } = createIndexedDbMemoriesGrowthStores(db);
    let notified = 0;
    souvenirs.subscribe(() => notified++);

    const kept = buildSouvenir();
    const deleted = buildSouvenir({
      id: "a2222222-2222-4333-8444-555555555555",
      deletedAt: "2026-11-10T10:00:00.000Z",
    });
    await souvenirs.upsert(kept);
    await souvenirs.upsert(deleted);

    expect(await souvenirs.list()).toEqual([kept]);
    expect(await souvenirs.list(true)).toHaveLength(2);
    expect((await souvenirs.outbox()).sort()).toEqual([kept.id, deleted.id].sort());
    expect(notified).toBe(2);

    await souvenirs.clearOutbox([kept.id]);
    expect(await souvenirs.outbox()).toEqual([deleted.id]);
    db.close();
  });

  it("does not enqueue rows applied from the server", async () => {
    const db = await openMuniDb(freshName());
    const { achievements } = createIndexedDbMemoriesGrowthStores(db);
    const achievement = buildAchievement();
    await achievements.upsert(achievement, { enqueue: false });
    expect(await achievements.get(achievement.id)).toEqual(achievement);
    expect(await achievements.outbox()).toEqual([]);
    db.close();
  });
});
