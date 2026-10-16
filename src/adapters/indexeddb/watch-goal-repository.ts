import type { WatchGoalRepository } from "@/application/ports/watch-goal-repository";
import type { WatchGoal } from "@/domain/watch-goal";
import { watchGoalSchema } from "@/domain/watch-goal";
import type { MetaStore } from "@/application/ports/item-repository";

const STORAGE_KEY = "watchGoals" as const;

function parseGoals(raw: unknown): WatchGoal[] {
  if (!Array.isArray(raw)) return [];
  const goals: WatchGoal[] = [];
  for (const entry of raw) {
    const parsed = watchGoalSchema.safeParse(entry);
    if (parsed.success) goals.push(parsed.data);
  }
  return goals;
}

export function createIndexedDbWatchGoalRepository(meta: MetaStore): WatchGoalRepository {
  async function readAll(): Promise<WatchGoal[]> {
    const raw = await meta.get(STORAGE_KEY);
    return parseGoals(raw ?? []);
  }

  async function writeAll(goals: WatchGoal[]): Promise<void> {
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
