import { describe, expect, it } from "vitest";

import { searchCatalogExercises } from "@/domain/fitness/catalog";
import { fitnessProgramSchema, plannedSessionSchema } from "@/domain/fitness/program";
import {
  defaultFitnessUserSettings,
  fitnessWorkoutLogSchema,
  setRowSchema,
  validateLoggedExercises,
} from "@/domain/fitness/workout-log";

describe("fitness domain", () => {
  it("validates program and planned session", () => {
    const session = plannedSessionSchema.parse({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      title: "Push",
      weekdays: [1, 3, 5],
      sortOrder: 0,
      exercises: [{ exerciseId: "bench-press" }],
    });
    const program = fitnessProgramSchema.parse({
      id: "11111111-2222-4333-8444-555555555555",
      name: "Force",
      isActive: true,
      plannedSessions: [session],
      deletedAt: null,
      fieldsUpdatedAt: {},
    });
    expect(program.name).toBe("Force");
  });

  it("rejects invalid RPE on set row", () => {
    const result = setRowSchema.safeParse({ rpe: 11 });
    expect(result.success).toBe(false);
  });

  it("validates logged exercises", () => {
    const err = validateLoggedExercises([
      {
        exerciseId: "squat",
        nameFrSnapshot: "Squat",
        sets: [{ reps: 5, chargeKg: 100, rpe: 8 }],
      },
    ]);
    expect(err).toBeNull();
  });

  it("searches catalog in French and English", () => {
    const exercises = [
      {
        id: "deadlift",
        nameFr: "Soulevé de terre",
        nameEn: "Deadlift",
        category: "dos",
        equipment: ["barre"],
        modality: "strength" as const,
      },
    ];
    expect(searchCatalogExercises(exercises, "deadlift")).toHaveLength(1);
    expect(searchCatalogExercises(exercises, "soulevé")).toHaveLength(1);
  });

  it("default settings use kg", () => {
    const settings = defaultFitnessUserSettings();
    expect(settings.chargeUnit).toBe("kg");
  });

  it("parses workout log", () => {
    const log = fitnessWorkoutLogSchema.parse({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      status: "in_progress",
      calendarDate: "2026-10-19",
      plannedSessionId: null,
      title: "Séance libre",
      startedAt: "2026-10-19T10:00:00.000Z",
      completedAt: null,
      catalogVersion: 1,
      loggedExercises: [],
      recovery: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    });
    expect(log.status).toBe("in_progress");
  });
});
