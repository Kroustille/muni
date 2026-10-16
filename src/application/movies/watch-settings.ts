import type { WatchGoalRepository } from "@/application/ports/watch-goal-repository";
import type { WatchGoal } from "@/domain/watch-goal";

export type WatchSettingsDeps = {
  repository: WatchGoalRepository;
  now: () => number;
};

export type WatchSettingsUseCases = {
  getAnnualGoal(year: number): Promise<WatchGoal | undefined>;
  setAnnualGoal(year: number, targetCount: number): Promise<WatchGoal>;
};

export function createWatchSettings({
  repository,
  now,
}: WatchSettingsDeps): WatchSettingsUseCases {
  return {
    getAnnualGoal: (year) => repository.get(year),
    setAnnualGoal: async (year, targetCount) => {
      const stamp = new Date(now()).toISOString();
      const goal: WatchGoal = {
        year,
        targetCount,
        fieldsUpdatedAt: { targetCount: stamp },
      };
      await repository.put(goal);
      return goal;
    },
  };
}
