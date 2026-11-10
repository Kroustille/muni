import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresMemoriesGrowthRepositories } from "@/adapters/postgres/memories-growth-repositories";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import {
  createMemoriesGrowthSyncService,
  type MemoriesGrowthSyncService,
} from "@/application/server/memories-growth-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";
import { achievementToWire } from "@/domain/achievement";
import { deterministicUuid, MEMORIES_NAMESPACE } from "@/domain/deterministic-uuid";
import { goalCheckinToWire, goalToWire } from "@/domain/goal";
import { souvenirToWire } from "@/domain/souvenir";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";
import {
  buildAchievement,
  buildGoal,
  buildGoalCheckin,
  buildSouvenir,
} from "../unit/memories-growth/fixtures";

const NOW = new Date("2026-11-11T12:00:00.000Z");
const EMPTY = { souvenirs: [], goals: [], goalCheckins: [], achievements: [] };

let testDb: TestDatabase | undefined;
let sync: MemoriesGrowthSyncService;
let userA: string;
let userB: string;

describe("memories-growth sync", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userA = (
      await users.create({
        id: "20000000-0000-4000-8000-000000000015",
        email: "memories-a@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    userB = (
      await users.create({
        id: "20000000-0000-4000-8000-000000000016",
        email: "memories-b@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    sync = createMemoriesGrowthSyncService({
      ...createPostgresMemoriesGrowthRepositories(testDb.db),
      now: () => NOW,
    });
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("round-trips every entity, with a goal and its check-in in one batch", async () => {
    const souvenir = souvenirToWire(
      buildSouvenir({
        favourite: true,
        mood: "joyeux",
        links: [{ kind: "item", id: "30000000-0000-4000-8000-000000000001" }],
        fieldsUpdatedAt: { title: "1-0-a" },
      }),
    );
    const goal = goalToWire(buildGoal({ fieldsUpdatedAt: { title: "1-0-a" } }));
    const checkin = goalCheckinToWire(buildGoalCheckin({ goalId: goal.id }));
    const achievement = achievementToWire(buildAchievement());

    const pushed = await sync.push(userA, {
      souvenirs: [souvenir],
      goals: [goal],
      goalCheckins: [checkin],
      achievements: [achievement],
    });
    expect(pushed.souvenirs[0]).toEqual({ ...souvenir, server_updated_at: NOW.toISOString() });

    const pulled = await sync.pull(userA, null, 100);
    expect(pulled.souvenirs).toEqual([{ ...souvenir, server_updated_at: NOW.toISOString() }]);
    expect(pulled.goals).toEqual([{ ...goal, server_updated_at: NOW.toISOString() }]);
    expect(pulled.goalCheckins).toEqual([{ ...checkin, server_updated_at: NOW.toISOString() }]);
    expect(pulled.achievements).toEqual([{ ...achievement, server_updated_at: NOW.toISOString() }]);
    expect(pulled.cursor).toBe(NOW.toISOString());
    expect(pulled.hasMore).toBe(false);
  });

  it("isolates users", async () => {
    const pulledB = await sync.pull(userB, null, 100);
    expect(pulledB).toMatchObject(EMPTY);
  });

  it("rejects check-ins for another user's goal", async () => {
    const otherUsersGoal = buildGoal().id; // created by userA above
    const checkin = goalCheckinToWire(
      buildGoalCheckin({ id: "c2222222-2222-4333-8444-555555555555", goalId: otherUsersGoal }),
    );
    await expect(sync.push(userB, { ...EMPTY, goalCheckins: [checkin] })).rejects.toBeInstanceOf(
      SyncValidationError,
    );
  });

  it("rejects user_id in rows and invalid goals", async () => {
    const souvenir = { ...souvenirToWire(buildSouvenir()), user_id: userB };
    await expect(
      sync.push(userA, { ...EMPTY, souvenirs: [souvenir as never] }),
    ).rejects.toBeInstanceOf(SyncValidationError);
    const badGoal = goalToWire(
      buildGoal({ id: "b2222222-2222-4333-8444-555555555555", metric: null }),
    );
    await expect(sync.push(userA, { ...EMPTY, goals: [badGoal] })).rejects.toBeInstanceOf(
      SyncValidationError,
    );
  });

  it("merges the same deterministic achievement pushed by two devices into one row", async () => {
    const id = await deterministicUuid(MEMORIES_NAMESPACE, "books_read:25");
    const deviceOne = achievementToWire(
      buildAchievement({
        id,
        threshold: 25,
        title: "25 livres lus",
        fieldsUpdatedAt: { title: "5-0-a" },
      }),
    );
    const deviceTwo = achievementToWire(
      buildAchievement({
        id,
        threshold: 25,
        title: "25 livres lus",
        celebratedAt: "2026-11-11T09:00:00.000Z",
        fieldsUpdatedAt: { title: "5-0-b", celebratedAt: "6-0-b" },
      }),
    );
    await sync.push(userA, { ...EMPTY, achievements: [deviceOne] });
    await sync.push(userA, { ...EMPTY, achievements: [deviceTwo] });

    const rows = (await sync.pull(userA, null, 100)).achievements.filter((a) => a.id === id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.celebrated_at).toBe("2026-11-11T09:00:00.000Z");
  });

  it("lets a tombstone win over an older edit", async () => {
    const base = buildSouvenir({ id: "a3333333-2222-4333-8444-555555555555" });
    await sync.push(userA, {
      ...EMPTY,
      souvenirs: [
        souvenirToWire({
          ...base,
          deletedAt: "2026-11-11T10:00:00.000Z",
          fieldsUpdatedAt: { deletedAt: "9-0-a" },
        }),
      ],
    });
    await sync.push(userA, {
      ...EMPTY,
      souvenirs: [
        souvenirToWire({ ...base, title: "Old edit", fieldsUpdatedAt: { title: "2-0-b" } }),
      ],
    });
    const row = (await sync.pull(userA, null, 100)).souvenirs.find((s) => s.id === base.id)!;
    expect(row.deleted_at).toBe("2026-11-11T10:00:00.000Z");
    expect(row.title).toBe("Old edit");
  });
});
