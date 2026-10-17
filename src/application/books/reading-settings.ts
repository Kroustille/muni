import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";
import {
  createAnnualGoalSettings,
  type AnnualGoalSettingsUseCases,
} from "@/application/shared/annual-goal";

export type ReadingSettingsDeps = {
  repository: ReadingGoalRepository;
  now: () => number;
};

export type ReadingSettingsUseCases = AnnualGoalSettingsUseCases<ReadingGoal>;

export function createReadingSettings(deps: ReadingSettingsDeps): ReadingSettingsUseCases {
  return createAnnualGoalSettings(deps);
}
