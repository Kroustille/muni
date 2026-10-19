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
let userId: string;

describe("fitness sync", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userId = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000099",
        email: "fitness-sync@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("pushes and pulls program", async () => {
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
      name: "Force",
      isActive: true,
      plannedSessions: [],
      deletedAt: null,
      fieldsUpdatedAt: { name: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userId, { programs: [wire], workoutLogs: [], skipRecords: [], settings: [] });
    const pulled = await sync.pull(userId, null, 100);
    expect(pulled.programs.some((p) => p.id === wire.id)).toBe(true);
  });
});
