import type { WatchGoalRepository } from "@/application/ports/watch-goal-repository";
import type { WatchGoal } from "@/domain/watch-goal";
import {
  createAnnualGoalSettings,
  type AnnualGoalSettingsUseCases,
} from "@/application/shared/annual-goal";

export type WatchSettingsDeps = {
  repository: WatchGoalRepository;
  now: () => number;
};

export type WatchSettingsUseCases = AnnualGoalSettingsUseCases<WatchGoal>;

export function createWatchSettings(deps: WatchSettingsDeps): WatchSettingsUseCases {
  return createAnnualGoalSettings(deps);
}
