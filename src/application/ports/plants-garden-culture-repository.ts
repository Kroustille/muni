import type { VegetableCulture } from "@/domain/vegetable-culture";

export type Unsubscribe = () => void;

export interface PlantsGardenCultureRepository {
  get(id: string): Promise<VegetableCulture | undefined>;
  list(): Promise<VegetableCulture[]>;
  upsert(culture: VegetableCulture, options?: { enqueue?: boolean }): Promise<VegetableCulture>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerPlantsGardenCultureRepository {
  transaction<T>(fn: (repo: ServerPlantsGardenCultureRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<VegetableCulture[]>;
  upsert(userId: string, culture: VegetableCulture): Promise<VegetableCulture>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<VegetableCulture[]>;
}
