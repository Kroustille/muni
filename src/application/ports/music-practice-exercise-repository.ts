import type { PracticeExercise } from "@/domain/practice-exercise";

export type Unsubscribe = () => void;

export interface MusicPracticeExerciseRepository {
  get(id: string): Promise<PracticeExercise | undefined>;
  list(): Promise<PracticeExercise[]>;
  upsert(exercise: PracticeExercise, options?: { enqueue?: boolean }): Promise<PracticeExercise>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticeExerciseRepository {
  transaction<T>(fn: (repo: ServerMusicPracticeExerciseRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<PracticeExercise[]>;
  upsert(userId: string, exercise: PracticeExercise): Promise<PracticeExercise>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<PracticeExercise[]>;
}
