import type { PlantCareProfile } from "@/domain/plant-care-profile";

export type Unsubscribe = () => void;

export interface PlantsGardenCareProfileRepository {
  get(id: string): Promise<PlantCareProfile | undefined>;
  list(): Promise<PlantCareProfile[]>;
  upsert(profile: PlantCareProfile, options?: { enqueue?: boolean }): Promise<PlantCareProfile>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerPlantsGardenCareProfileRepository {
  transaction<T>(fn: (repo: ServerPlantsGardenCareProfileRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<PlantCareProfile[]>;
  upsert(userId: string, profile: PlantCareProfile): Promise<PlantCareProfile>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<PlantCareProfile[]>;
}
