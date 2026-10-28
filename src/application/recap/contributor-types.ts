import type { ItemRepository } from "@/application/ports/item-repository";
import type { FitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import type { MusicPracticeRecapRepository } from "@/application/ports/music-practice-recap-repository";
import type { PlantsRecapRepository } from "@/application/ports/plants-recap-repository";

export type RecapDateRange = {
  startDate: string;
  endDate: string;
  timeZone: string;
};

export type RecapDeps = {
  items: ItemRepository;
  fitnessWorkouts: FitnessWorkoutRepository;
  musicPractice: MusicPracticeRecapRepository;
  plants: PlantsRecapRepository;
};

export type DomainRecapContributor = {
  domainId: import("@/domain/recap").RecapDomainId;
  collectAchievements(
    deps: RecapDeps,
    range: RecapDateRange,
  ): Promise<import("@/domain/recap").RecapAchievement[]>;
};
