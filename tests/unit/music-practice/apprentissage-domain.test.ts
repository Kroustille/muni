import { describe, expect, it } from "vitest";

import { validateLearningPiece } from "@/domain/learning-piece";
import { validatePlanAssignment, validatePracticePlan } from "@/domain/practice-plan";
import { validatePracticeExercise } from "@/domain/practice-exercise";
import { validatePracticeInstrument } from "@/domain/practice-instrument";
import { validatePracticeLog } from "@/domain/practice-log";
import {
  buildLearningPiece,
  buildPlanAssignment,
  buildPracticeExercise,
  buildPracticeInstrument,
  buildPracticeLog,
  buildPracticePlan,
} from "./fixtures";

describe("apprentissage domain validation", () => {
  it("validates instrument name", () => {
    expect(validatePracticeInstrument(buildPracticeInstrument())).toBeNull();
  });

  it("validates exercise title", () => {
    expect(validatePracticeExercise(buildPracticeExercise())).toBeNull();
  });

  it("requires weekdays or specificDates on assignment", () => {
    expect(
      validatePlanAssignment(
        buildPlanAssignment({ weekdays: [], specificDates: [] }),
      ),
    ).toBe("assignment requires weekdays or specificDates");
  });

  it("validates plan assignments", () => {
    expect(validatePracticePlan(buildPracticePlan())).toBeNull();
  });

  it("rejects future practicedAt on log", () => {
    const log = buildPracticeLog({ practicedAt: "2099-01-01" });
    expect(validatePracticeLog(log, "2026-01-01")).toBe("date cannot be in the future");
  });

  it("validates learning piece dates", () => {
    expect(validateLearningPiece(buildLearningPiece(), "2026-06-01")).toBeNull();
  });
});
