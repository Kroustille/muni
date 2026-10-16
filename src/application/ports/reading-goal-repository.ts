import type { ReadingGoal } from "@/domain/reading-goal";

export interface ReadingGoalRepository {
  get(year: number): Promise<ReadingGoal | undefined>;
  list(): Promise<ReadingGoal[]>;
  put(goal: ReadingGoal): Promise<void>;
}
