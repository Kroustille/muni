import { describe, expect, it } from "vitest";

import {
  assignmentsForDate,
  hydrateTodayExercises,
  resolveTodayExercises,
} from "@/application/music-practice/practice-today";
import { buildPlanAssignment, buildPracticeExercise, buildPracticePlan } from "./fixtures";

describe("practice today", () => {
  it("filters assignments by weekday and specific date", () => {
    const plan = buildPracticePlan({
      assignments: [
        buildPlanAssignment({
          id: "a1",
          weekdays: [1],
          specificDates: ["2026-06-15"],
        }),
        buildPlanAssignment({
          id: "a2",
          exerciseId: "ex-2",
          weekdays: [2],
        }),
      ],
    });
    const monday = assignmentsForDate(plan, "2026-06-15");
    expect(monday.map((a) => a.id)).toContain("a1");
    expect(assignmentsForDate(plan, "2026-06-16").map((a) => a.id)).toContain("a2");
  });

  it("returns empty when plan inactive or deleted", () => {
    const active = buildPracticePlan({ isActive: false });
    expect(resolveTodayExercises(active, "2026-06-15")).toEqual([]);
    const deleted = buildPracticePlan({ deletedAt: "2026-01-01T00:00:00.000Z" });
    expect(resolveTodayExercises(deleted, "2026-06-15")).toEqual([]);
  });

  it("dedupes exercises by lowest sort order and hydrates live rows", () => {
    const exId = "11111111-1111-4111-8111-111111111111";
    const plan = buildPracticePlan({
      assignments: [
        buildPlanAssignment({ id: "low", exerciseId: exId, sortOrder: 1 }),
        buildPlanAssignment({ id: "high", exerciseId: exId, sortOrder: 5 }),
      ],
    });
    const today = resolveTodayExercises(plan, "2026-06-15");
    expect(today).toHaveLength(1);
    expect(today[0]?.assignmentId).toBe("low");
    const exercise = buildPracticeExercise({ id: exId });
    const hydrated = hydrateTodayExercises(today, [exercise]);
    expect(hydrated[0]?.exercise.id).toBe(exId);
    expect(hydrateTodayExercises(today, [{ ...exercise, deletedAt: "2026-01-01T00:00:00.000Z" }])).toEqual(
      [],
    );
  });
});
