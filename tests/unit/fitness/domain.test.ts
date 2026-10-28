import { describe, expect, it } from "vitest";

import { searchCatalogExercises } from "@/domain/fitness/catalog";
import {
  fitnessSessionTemplateSchema,
  templateExerciseSchema,
} from "@/domain/fitness/session-template";
import {
  defaultFitnessUserSettings,
  fitnessWorkoutLogSchema,
  setRowSchema,
  validateLoggedExercises,
} from "@/domain/fitness/workout-log";

describe("fitness domain", () => {
  it("validates session template", () => {
    const exercise = templateExerciseSchema.parse({
      exerciseId: "bench-press",
    });
    const template = fitnessSessionTemplateSchema.parse({
      id: "11111111-2222-4333-8444-555555555555",
      title: "Force",
      sortOrder: 0,
      templateExercises: [exercise],
      deletedAt: null,
      fieldsUpdatedAt: {},
    });
    expect(template.title).toBe("Force");
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
      sessionTemplateId: null,
      scheduledSessionId: null,
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
