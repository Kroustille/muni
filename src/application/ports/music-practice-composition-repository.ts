import type { MusicComposition } from "@/domain/music-composition";

export type Unsubscribe = () => void;

export interface MusicPracticeCompositionRepository {
  get(id: string): Promise<MusicComposition | undefined>;
  list(): Promise<MusicComposition[]>;
  upsert(composition: MusicComposition, options?: { enqueue?: boolean }): Promise<MusicComposition>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticeCompositionRepository {
  transaction<T>(fn: (repo: ServerMusicPracticeCompositionRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<MusicComposition[]>;
  upsert(userId: string, composition: MusicComposition): Promise<MusicComposition>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<MusicComposition[]>;
}
