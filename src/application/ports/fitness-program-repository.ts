import type { FitnessProgram } from "@/domain/fitness/program";

export type Unsubscribe = () => void;

export interface FitnessProgramRepository {
  get(id: string): Promise<FitnessProgram | undefined>;
  getActive(): Promise<FitnessProgram | undefined>;
  list(): Promise<FitnessProgram[]>;
  upsert(program: FitnessProgram, options?: { enqueue?: boolean }): Promise<FitnessProgram>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerFitnessProgramRepository {
  transaction<T>(fn: (repo: ServerFitnessProgramRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<FitnessProgram[]>;
  upsert(userId: string, program: FitnessProgram): Promise<FitnessProgram>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<FitnessProgram[]>;
}
