import type { WatchGoal } from "@/domain/watch-goal";

export interface WatchGoalRepository {
  get(year: number): Promise<WatchGoal | undefined>;
  list(): Promise<WatchGoal[]>;
  put(goal: WatchGoal): Promise<void>;
}
