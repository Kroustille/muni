import type { Plant } from "@/domain/plant";

export type Unsubscribe = () => void;

export interface PlantsGardenPlantRepository {
  get(id: string): Promise<Plant | undefined>;
  list(includeDeleted?: boolean): Promise<Plant[]>;
  upsert(plant: Plant, options?: { enqueue?: boolean }): Promise<Plant>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerPlantsGardenPlantRepository {
  transaction<T>(fn: (repo: ServerPlantsGardenPlantRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<Plant[]>;
  upsert(userId: string, plant: Plant): Promise<Plant>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<Plant[]>;
}
