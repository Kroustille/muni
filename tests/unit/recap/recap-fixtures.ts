import type { RecapDeps } from "@/application/recap/contributor-types";
import { InMemoryItemRepository } from "../../helpers/in-memory-item-repository";
import { emptyMusicPracticeRecapRepository } from "@/application/ports/music-practice-recap-repository";
import { emptyPlantsRecapRepository } from "@/application/ports/plants-recap-repository";
import type { FitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";

export class InMemoryFitnessWorkoutRepository implements FitnessWorkoutRepository {
  private logs: FitnessWorkoutLog[] = [];

  seed(logs: FitnessWorkoutLog[]): void {
    this.logs = logs;
  }

  async list(): Promise<FitnessWorkoutLog[]> {
    return [...this.logs];
  }

  async get(id: string): Promise<FitnessWorkoutLog | undefined> {
    return this.logs.find((log) => log.id === id);
  }

  async getInProgress(): Promise<FitnessWorkoutLog | undefined> {
    return this.logs.find((log) => log.status === "in_progress" && log.deletedAt == null);
  }

  async upsert(log: FitnessWorkoutLog): Promise<FitnessWorkoutLog> {
    this.logs = this.logs.filter((entry) => entry.id !== log.id);
    this.logs.push(log);
    return log;
  }

  subscribe(): () => void {
    return () => {};
  }

  async outbox(): Promise<string[]> {
    return [];
  }

  async clearOutbox(): Promise<void> {}
}

export function createRecapTestDeps(overrides: Partial<RecapDeps> = {}): RecapDeps {
  return {
    items: new InMemoryItemRepository(),
    fitnessWorkouts: new InMemoryFitnessWorkoutRepository(),
    musicPractice: emptyMusicPracticeRecapRepository,
    plants: emptyPlantsRecapRepository,
    ...overrides,
  };
}
