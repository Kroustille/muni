import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";
import { readingGoalSchema } from "@/domain/reading-goal";
import type { MetaStore } from "@/application/ports/item-repository";

const STORAGE_KEY = "readingGoals" as const;

function parseGoals(raw: unknown): ReadingGoal[] {
  if (!Array.isArray(raw)) return [];
  const goals: ReadingGoal[] = [];
  for (const entry of raw) {
    const parsed = readingGoalSchema.safeParse(entry);
    if (parsed.success) goals.push(parsed.data);
  }
  return goals;
}

export function createIndexedDbReadingGoalRepository(meta: MetaStore): ReadingGoalRepository {
  async function readAll(): Promise<ReadingGoal[]> {
    const raw = await meta.get(STORAGE_KEY);
    return parseGoals(raw ?? []);
  }

  async function writeAll(goals: ReadingGoal[]): Promise<void> {
    await meta.set(STORAGE_KEY, goals);
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
