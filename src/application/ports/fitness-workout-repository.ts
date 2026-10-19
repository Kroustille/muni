import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";

export type Unsubscribe = () => void;

export interface FitnessWorkoutRepository {
  get(id: string): Promise<FitnessWorkoutLog | undefined>;
  list(): Promise<FitnessWorkoutLog[]>;
  getInProgress(): Promise<FitnessWorkoutLog | undefined>;
  upsert(log: FitnessWorkoutLog, options?: { enqueue?: boolean }): Promise<FitnessWorkoutLog>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerFitnessWorkoutRepository {
  transaction<T>(fn: (repo: ServerFitnessWorkoutRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<FitnessWorkoutLog[]>;
  upsert(userId: string, log: FitnessWorkoutLog): Promise<FitnessWorkoutLog>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<FitnessWorkoutLog[]>;
}
