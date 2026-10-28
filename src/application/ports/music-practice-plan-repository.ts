import type { PracticePlan } from "@/domain/practice-plan";

export type Unsubscribe = () => void;

export interface MusicPracticePlanRepository {
  get(id: string): Promise<PracticePlan | undefined>;
  getActive(): Promise<PracticePlan | undefined>;
  list(): Promise<PracticePlan[]>;
  upsert(plan: PracticePlan, options?: { enqueue?: boolean }): Promise<PracticePlan>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerMusicPracticePlanRepository {
  transaction<T>(fn: (repo: ServerMusicPracticePlanRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<PracticePlan[]>;
  upsert(userId: string, plan: PracticePlan): Promise<PracticePlan>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<PracticePlan[]>;
  listActive(userId: string): Promise<PracticePlan[]>;
  demoteOtherActivePlans(userId: string, exceptId: string): Promise<void>;
}
