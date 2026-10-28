import type { PracticeLog } from "@/domain/practice-log";

export type Unsubscribe = () => void;

export interface MusicPracticeLogRepository {
  get(id: string): Promise<PracticeLog | undefined>;
  list(): Promise<PracticeLog[]>;
  upsert(log: PracticeLog, options?: { enqueue?: boolean }): Promise<PracticeLog>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticeLogRepository {
  transaction<T>(fn: (repo: ServerMusicPracticeLogRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<PracticeLog[]>;
  upsert(userId: string, log: PracticeLog): Promise<PracticeLog>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<PracticeLog[]>;
}
