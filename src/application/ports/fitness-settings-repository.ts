import type { FitnessUserSettings } from "@/domain/fitness/workout-log";

export type Unsubscribe = () => void;

export interface FitnessSettingsRepository {
  get(): Promise<FitnessUserSettings | undefined>;
  upsert(settings: FitnessUserSettings, options?: { enqueue?: boolean }): Promise<FitnessUserSettings>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerFitnessSettingsRepository {
  transaction<T>(fn: (repo: ServerFitnessSettingsRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<FitnessUserSettings[]>;
  upsert(userId: string, settings: FitnessUserSettings): Promise<FitnessUserSettings>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<FitnessUserSettings[]>;
}

export interface FitnessExerciseCatalogStore {
  getVersion(): Promise<number | undefined>;
  setVersion(version: number): Promise<void>;
  list(): Promise<import("@/domain/fitness/catalog").StoredCatalogExercise[]>;
  upsertMany(entries: import("@/domain/fitness/catalog").StoredCatalogExercise[]): Promise<void>;
  getById(id: string): Promise<import("@/domain/fitness/catalog").StoredCatalogExercise | undefined>;
}
