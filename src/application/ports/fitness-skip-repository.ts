import type { FitnessSkipRecord } from "@/domain/fitness/workout-log";

export type Unsubscribe = () => void;

export interface FitnessSkipRepository {
  get(id: string): Promise<FitnessSkipRecord | undefined>;
  list(): Promise<FitnessSkipRecord[]>;
  upsert(record: FitnessSkipRecord, options?: { enqueue?: boolean }): Promise<FitnessSkipRecord>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerFitnessSkipRepository {
  transaction<T>(fn: (repo: ServerFitnessSkipRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<FitnessSkipRecord[]>;
  upsert(userId: string, record: FitnessSkipRecord): Promise<FitnessSkipRecord>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<FitnessSkipRecord[]>;
}
