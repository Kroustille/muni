import type { DjSet } from "@/domain/dj-set";

export type Unsubscribe = () => void;

export interface MusicPracticeDjSetRepository {
  get(id: string): Promise<DjSet | undefined>;
  list(): Promise<DjSet[]>;
  upsert(djSet: DjSet, options?: { enqueue?: boolean }): Promise<DjSet>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticeDjSetRepository {
  transaction<T>(fn: (repo: ServerMusicPracticeDjSetRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<DjSet[]>;
  upsert(userId: string, djSet: DjSet): Promise<DjSet>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<DjSet[]>;
}
