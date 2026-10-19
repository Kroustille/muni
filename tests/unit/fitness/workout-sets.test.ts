import { describe, expect, it } from "vitest";

import { validateLoggedExercises } from "@/domain/fitness/workout-log";

describe("workout set validation", () => {
  it("rejects rpe out of range", () => {
    const err = validateLoggedExercises([
      {
        exerciseId: "squat",
        nameFrSnapshot: "Squat",
        sets: [{ rpe: 11 }],
      },
    ]);
    expect(err).not.toBeNull();
  });

  it("accepts valid sets", () => {
    const err = validateLoggedExercises([
      {
        exerciseId: "squat",
        nameFrSnapshot: "Squat",
        sets: [{ reps: 5, chargeKg: 100, rpe: 8, durationSeconds: 60 }],
      },
    ]);
    expect(err).toBeNull();
  });
});
