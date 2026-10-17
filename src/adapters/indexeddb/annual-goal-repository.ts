import type { z } from "zod";

import type { MetaKey, MetaStore, MetaValues } from "@/application/ports/item-repository";

type GoalStorageKey = Extract<MetaKey, "readingGoals" | "watchGoals">;

type AnnualGoalRow = {
  year: number;
  targetCount: number;
  fieldsUpdatedAt: Record<string, string>;
};

export function createIndexedDbAnnualGoalRepository<TGoal extends AnnualGoalRow>(
  meta: MetaStore,
  storageKey: GoalStorageKey,
  schema: z.ZodType<TGoal>,
): {
  get(year: number): Promise<TGoal | undefined>;
  list(): Promise<TGoal[]>;
  put(goal: TGoal): Promise<void>;
} {
  function parseGoals(raw: unknown): TGoal[] {
    if (!Array.isArray(raw)) return [];
    const goals: TGoal[] = [];
    for (const entry of raw) {
      const parsed = schema.safeParse(entry);
      if (parsed.success) goals.push(parsed.data);
    }
    return goals;
  }

  async function readAll(): Promise<TGoal[]> {
    const raw = await meta.get(storageKey);
    return parseGoals(raw ?? []);
  }

  async function writeAll(goals: TGoal[]): Promise<void> {
    await meta.set(storageKey, goals as MetaValues[GoalStorageKey]);
  }

  return {
    get: async (year) => (await readAll()).find((goal) => goal.year === year),
    list: readAll,
    put: async (goal) => {
      const goals = await readAll();
      const next = goals.filter((row) => row.year !== goal.year);
      next.push(goal);
      await writeAll(next);
    },
  };
}
