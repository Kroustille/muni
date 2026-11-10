import type { Achievement, AchievementWire } from "@/domain/achievement";
import type { Goal, GoalCheckin, GoalCheckinWire, GoalWire } from "@/domain/goal";
import type { Souvenir, SouvenirWire } from "@/domain/souvenir";

export type Unsubscribe = () => void;

/** Local (IndexedDB) store for one synced 015 entity, with its own outbox. */
export interface SyncedLocalStore<T extends { id: string; deletedAt: string | null }> {
  get(id: string): Promise<T | undefined>;
  list(includeDeleted?: boolean): Promise<T[]>;
  upsert(row: T, options?: { enqueue?: boolean }): Promise<T>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export type SouvenirStore = SyncedLocalStore<Souvenir>;
export type GoalStore = SyncedLocalStore<Goal>;
export type GoalCheckinStore = SyncedLocalStore<GoalCheckin>;
export type AchievementStore = SyncedLocalStore<Achievement>;

export type MemoriesGrowthLocalStores = {
  souvenirs: SouvenirStore;
  goals: GoalStore;
  goalCheckins: GoalCheckinStore;
  achievements: AchievementStore;
};

/** Server (Postgres) repository for one synced 015 entity; rows exchanged as wire objects. */
export interface ServerSyncedRepository<W extends { id: string }> {
  transaction<R>(fn: (repo: ServerSyncedRepository<W>) => Promise<R>): Promise<R>;
  /** Must run inside `transaction`; locks rows FOR UPDATE. */
  findByIds(userId: string, ids: string[]): Promise<W[]>;
  /** Must run inside `transaction`. `wire.server_updated_at` is persisted. */
  upsert(userId: string, wire: W): Promise<W>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<W[]>;
}

export type MemoriesGrowthServerRepositories = {
  souvenirs: ServerSyncedRepository<SouvenirWire>;
  goals: ServerSyncedRepository<GoalWire>;
  goalCheckins: ServerSyncedRepository<GoalCheckinWire> & {
    /** Ids among `goalIds` that exist (tombstones included) for `userId`. */
    existingGoalIds(userId: string, goalIds: string[]): Promise<Set<string>>;
  };
  achievements: ServerSyncedRepository<AchievementWire>;
};

export type MemoriesGrowthPayload = {
  souvenirs: SouvenirWire[];
  goals: GoalWire[];
  goalCheckins: GoalCheckinWire[];
  achievements: AchievementWire[];
};

export type MemoriesGrowthPullResult = MemoriesGrowthPayload & { cursor: string; hasMore: boolean };

export type MemoriesGrowthRemoteStore = {
  push(body: MemoriesGrowthPayload): Promise<MemoriesGrowthPayload>;
  pull(since: string | null, limit: number): Promise<MemoriesGrowthPullResult>;
};
