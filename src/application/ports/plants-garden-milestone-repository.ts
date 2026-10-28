import type { VegetableMilestone } from "@/domain/vegetable-milestone";

export type Unsubscribe = () => void;

export interface PlantsGardenMilestoneRepository {
  get(id: string): Promise<VegetableMilestone | undefined>;
  listByCulture(cultureId: string): Promise<VegetableMilestone[]>;
  listAll(): Promise<VegetableMilestone[]>;
  listInRange(from: string, to: string): Promise<VegetableMilestone[]>;
  upsert(milestone: VegetableMilestone, options?: { enqueue?: boolean }): Promise<VegetableMilestone>;
  subscribe(listener: () => void): Unsubscribe;
  outbox(): Promise<string[]>;
  clearOutbox(ids: string[]): Promise<void>;
}

export interface ServerPlantsGardenMilestoneRepository {
  transaction<T>(fn: (repo: ServerPlantsGardenMilestoneRepository) => Promise<T>): Promise<T>;
  findByIds(userId: string, ids: string[]): Promise<VegetableMilestone[]>;
  findOnDay(
    userId: string,
    cultureId: string,
    milestoneType: string,
    day: string,
    excludeId?: string,
  ): Promise<VegetableMilestone | undefined>;
  upsert(userId: string, milestone: VegetableMilestone): Promise<VegetableMilestone>;
  pullSince(userId: string, since: Date | null, limit: number): Promise<VegetableMilestone[]>;
  listInRange(userId: string, from: string, to: string): Promise<VegetableMilestone[]>;
}
