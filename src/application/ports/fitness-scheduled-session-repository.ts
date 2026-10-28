import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";

export type Unsubscribe = () => void;

export interface FitnessScheduledSessionRepository {
  get(id: string): Promise<FitnessScheduledSession | undefined>;
  list(): Promise<FitnessScheduledSession[]>;
  listForDate(calendarDate: string): Promise<FitnessScheduledSession[]>;
  upsert(row: FitnessScheduledSession, options?: { enqueue?: boolean }): Promise<FitnessScheduledSession>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerFitnessScheduledSessionRepository {
  transaction<T>(fn: (repo: ServerFitnessScheduledSessionRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<FitnessScheduledSession[]>;
  upsert(userId: string, row: FitnessScheduledSession): Promise<FitnessScheduledSession>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<FitnessScheduledSession[]>;
}
