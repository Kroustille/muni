import { describe, expect, it } from "vitest";

import { fitnessRecapContributor } from "@/application/recap/contributors/fitness-contributor";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import { createRecapTestDeps, InMemoryFitnessWorkoutRepository } from "./recap-fixtures";

const workout: FitnessWorkoutLog = {
  id: "00000000-0000-4000-8000-000000000099",
  status: "completed",
  calendarDate: "2026-02-01",
  sessionTemplateId: null,
  scheduledSessionId: null,
  title: "Push day",
  startedAt: "2026-02-01T08:00:00.000Z",
  completedAt: "2026-02-01T09:00:00.000Z",
  catalogVersion: 1,
  loggedExercises: [],
  recovery: null,
  deletedAt: null,
  fieldsUpdatedAt: {},
};

describe("fitnessRecapContributor", () => {
  it("includes completed workouts in range", async () => {
    const fitnessWorkouts = new InMemoryFitnessWorkoutRepository();
    fitnessWorkouts.seed([workout]);
    const deps = createRecapTestDeps({ fitnessWorkouts });
    const rows = await fitnessRecapContributor.collectAchievements(deps, {
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(1);
  });
});
