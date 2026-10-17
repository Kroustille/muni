import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";
import { readingGoalSchema } from "@/domain/reading-goal";
import type { MetaStore } from "@/application/ports/item-repository";
import { createIndexedDbAnnualGoalRepository } from "./annual-goal-repository";

const STORAGE_KEY = "readingGoals" as const;

export function createIndexedDbReadingGoalRepository(meta: MetaStore): ReadingGoalRepository {
  return createIndexedDbAnnualGoalRepository<ReadingGoal>(meta, STORAGE_KEY, readingGoalSchema);
}
