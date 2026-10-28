import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresFitnessSessionTemplateRepository } from "@/adapters/postgres/fitness-session-template-repository";
import { createPostgresFitnessScheduledSessionRepository } from "@/adapters/postgres/fitness-scheduled-session-repository";
import { createPostgresFitnessWorkoutRepository } from "@/adapters/postgres/fitness-workout-repository";
import { createPostgresFitnessSkipRepository } from "@/adapters/postgres/fitness-skip-repository";
import { createPostgresFitnessSettingsRepository } from "@/adapters/postgres/fitness-settings-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { createFitnessSyncService } from "@/application/server/fitness-sync-service";
import { fitnessSessionTemplateToWire } from "@/domain/fitness/session-template";
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

  it("pushes and pulls session template", async () => {
    if (testDb === undefined) return;
    const sync = createFitnessSyncService({
      templates: createPostgresFitnessSessionTemplateRepository(testDb.db),
      scheduled: createPostgresFitnessScheduledSessionRepository(testDb.db),
      workouts: createPostgresFitnessWorkoutRepository(testDb.db),
      skips: createPostgresFitnessSkipRepository(testDb.db),
      settings: createPostgresFitnessSettingsRepository(testDb.db),
      now: () => NOW,
    });

    const wire = fitnessSessionTemplateToWire({
      id: "11111111-2222-4333-8444-555555555555",
      title: "Force",
      sortOrder: 0,
      templateExercises: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userId, {
      sessionTemplates: [wire],
      scheduledSessions: [],
      workoutLogs: [],
      skipRecords: [],
      settings: [],
    });
    const pulled = await sync.pull(userId, null, 100);
    expect(pulled.sessionTemplates.some((p) => p.id === wire.id)).toBe(true);
  });
});
