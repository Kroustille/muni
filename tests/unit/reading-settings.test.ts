import { describe, expect, it } from "vitest";

import { createReadingSettings } from "@/application/books/reading-settings";
import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";

function memoryRepo(): ReadingGoalRepository & { goals: ReadingGoal[] } {
  const goals: ReadingGoal[] = [];
  return {
    goals,
    get: async (year) => goals.find((g) => g.year === year),
    list: async () => [...goals],
    put: async (goal) => {
      const idx = goals.findIndex((g) => g.year === goal.year);
      if (idx >= 0) goals[idx] = goal;
      else goals.push(goal);
    },
  };
}

describe("reading settings", () => {
  it("stores annual goal", async () => {
    const repo = memoryRepo();
    const settings = createReadingSettings({ repository: repo, now: () => 1_700_000_000_000 });
    const goal = await settings.setAnnualGoal(2026, 12);
    expect(goal.targetCount).toBe(12);
    expect(await settings.getAnnualGoal(2026)).toEqual(goal);
  });
});
