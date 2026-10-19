import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresFitnessProgramRepository } from "@/adapters/postgres/fitness-program-repository";
import { createPostgresFitnessWorkoutRepository } from "@/adapters/postgres/fitness-workout-repository";
import { createPostgresFitnessSkipRepository } from "@/adapters/postgres/fitness-skip-repository";
import { createPostgresFitnessSettingsRepository } from "@/adapters/postgres/fitness-settings-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { createFitnessSyncService } from "@/application/server/fitness-sync-service";
import { fitnessProgramToWire } from "@/domain/fitness/program";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");

let testDb: TestDatabase | undefined;
let userA: string;
let userB: string;

describe("fitness isolation", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userA = (
      await users.create({
        id: "10000000-0000-4000-8000-0000000000a1",
        email: "fit-a@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    userB = (
      await users.create({
        id: "10000000-0000-4000-8000-0000000000b2",
        email: "fit-b@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("does not leak programs between users", async () => {
    if (testDb === undefined) return;
    const sync = createFitnessSyncService({
      programs: createPostgresFitnessProgramRepository(testDb.db),
      workouts: createPostgresFitnessWorkoutRepository(testDb.db),
      skips: createPostgresFitnessSkipRepository(testDb.db),
      settings: createPostgresFitnessSettingsRepository(testDb.db),
      now: () => NOW,
    });

    const wire = fitnessProgramToWire({
      id: "11111111-2222-4333-8444-555555555555",
      name: "User A",
      isActive: true,
      plannedSessions: [],
      deletedAt: null,
      fieldsUpdatedAt: { name: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userA, { programs: [wire], workoutLogs: [], skipRecords: [], settings: [] });
    const pulledB = await sync.pull(userB, null, 100);
    expect(pulledB.programs).toHaveLength(0);
  });
});
