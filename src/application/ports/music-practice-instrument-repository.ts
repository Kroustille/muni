import type { PracticeInstrument } from "@/domain/practice-instrument";

export type Unsubscribe = () => void;

export interface MusicPracticeInstrumentRepository {
  get(id: string): Promise<PracticeInstrument | undefined>;
  list(): Promise<PracticeInstrument[]>;
  upsert(instrument: PracticeInstrument, options?: { enqueue?: boolean }): Promise<PracticeInstrument>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticeInstrumentRepository {
  transaction<T>(fn: (repo: ServerMusicPracticeInstrumentRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<PracticeInstrument[]>;
  upsert(userId: string, instrument: PracticeInstrument): Promise<PracticeInstrument>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<PracticeInstrument[]>;
}
