import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";

export type ReadingSettingsDeps = {
  repository: ReadingGoalRepository;
  now: () => number;
};

export type ReadingSettingsUseCases = {
  getAnnualGoal(year: number): Promise<ReadingGoal | undefined>;
  setAnnualGoal(year: number, targetCount: number): Promise<ReadingGoal>;
};

export function createReadingSettings({
  repository,
  now,
}: ReadingSettingsDeps): ReadingSettingsUseCases {
  return {
    getAnnualGoal: (year) => repository.get(year),
    setAnnualGoal: async (year, targetCount) => {
      const stamp = new Date(now()).toISOString();
      const goal: ReadingGoal = {
        year,
        targetCount,
        fieldsUpdatedAt: { targetCount: stamp },
      };
      await repository.put(goal);
      return goal;
    },
  };
}
