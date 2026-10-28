import { describe, expect, it } from "vitest";

import { validateDjSet } from "@/domain/dj-set";
import { validateMusicComposition } from "@/domain/music-composition";
import { validateLearningPiece } from "@/domain/learning-piece";
import { validatePlanAssignment, validatePracticePlan } from "@/domain/practice-plan";
import { validatePracticeExercise } from "@/domain/practice-exercise";
import { validatePracticeInstrument } from "@/domain/practice-instrument";
import { validatePracticeLog } from "@/domain/practice-log";
import {
  buildDjSet,
  buildLearningPiece,
  buildMusicComposition,
  buildPlanAssignment,
  buildPracticeExercise,
  buildPracticeInstrument,
  buildPracticeLog,
  buildPracticePlan,
} from "./fixtures";

describe("music practice domain validation branches", () => {
  it("validates composition date fields", () => {
    expect(
      validateMusicComposition(
        buildMusicComposition({ startedAt: "2099-01-01", finishedAt: null }),
        "2026-01-01",
      ),
    ).toBe("date cannot be in the future");
    expect(
      validateMusicComposition(
        buildMusicComposition({ status: "idea", finishedAt: "2026-01-01" }),
        "2026-01-01",
      ),
    ).toBe("finishedAt must be null unless status is finished");
  });

  it("validates dj performed date", () => {
    expect(
      validateDjSet(buildDjSet({ status: "performed", performedAt: "2099-01-01" }), "2026-01-01"),
    ).toBe("date cannot be in the future");
  });

  it("validates apprentissage entities", () => {
    expect(validatePracticeInstrument(buildPracticeInstrument({ name: "" }))).not.toBeNull();
    expect(validatePracticeExercise(buildPracticeExercise({ title: "" }))).not.toBeNull();
    expect(validatePracticePlan(buildPracticePlan({ assignments: [] }))).toBeNull();
    expect(
      validatePlanAssignment(buildPlanAssignment({ weekdays: null, specificDates: ["2026-01-01"] })),
    ).toBeNull();
    expect(validatePracticeLog(buildPracticeLog(), "2026-01-01")).toBeNull();
    expect(
      validateLearningPiece(buildLearningPiece({ startedAt: "2099-01-01" }), "2026-01-01"),
    ).toBe("date cannot be in the future");
  });
});
