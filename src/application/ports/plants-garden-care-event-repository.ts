import type { PlantCareEvent } from "@/domain/plant-care-event";

export type Unsubscribe = () => void;

export interface PlantsGardenCareEventRepository {
  get(id: string): Promise<PlantCareEvent | undefined>;
  listByPlant(plantId: string): Promise<PlantCareEvent[]>;
  listAll(): Promise<PlantCareEvent[]>;
  listInRange(from: string, to: string): Promise<PlantCareEvent[]>;
  upsert(event: PlantCareEvent, options?: { enqueue?: boolean }): Promise<PlantCareEvent>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerPlantsGardenCareEventRepository {
  transaction<T>(fn: (repo: ServerPlantsGardenCareEventRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<PlantCareEvent[]>;
  findWaterOnDay(userId: string, plantId: string, day: string, excludeId?: string): Promise<PlantCareEvent | undefined>;
  upsert(userId: string, event: PlantCareEvent): Promise<PlantCareEvent>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<PlantCareEvent[]>;
  listInRange(userId: string, from: string, to: string): Promise<PlantCareEvent[]>;
}
