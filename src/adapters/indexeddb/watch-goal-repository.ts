import type { WatchGoalRepository } from "@/application/ports/watch-goal-repository";
import type { WatchGoal } from "@/domain/watch-goal";
import { watchGoalSchema } from "@/domain/watch-goal";
import type { MetaStore } from "@/application/ports/item-repository";
import { createIndexedDbAnnualGoalRepository } from "./annual-goal-repository";

const STORAGE_KEY = "watchGoals" as const;

export function createIndexedDbWatchGoalRepository(meta: MetaStore): WatchGoalRepository {
  return createIndexedDbAnnualGoalRepository<WatchGoal>(meta, STORAGE_KEY, watchGoalSchema);
}
