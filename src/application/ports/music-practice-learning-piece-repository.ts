import type { LearningPiece } from "@/domain/learning-piece";

export type Unsubscribe = () => void;

export interface MusicPracticeLearningPieceRepository {
  get(id: string): Promise<LearningPiece | undefined>;
  list(): Promise<LearningPiece[]>;
  upsert(piece: LearningPiece, options?: { enqueue?: boolean }): Promise<LearningPiece>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticeLearningPieceRepository {
  transaction<T>(fn: (repo: ServerMusicPracticeLearningPieceRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<LearningPiece[]>;
  upsert(userId: string, piece: LearningPiece): Promise<LearningPiece>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<LearningPiece[]>;
}
