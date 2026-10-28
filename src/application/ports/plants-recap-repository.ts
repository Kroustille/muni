export type PlantCareEventRecapRow = {
  occurredAt: string;
  title: string;
  subtitleKey: string;
  plantId: string;
  deleted: boolean;
};

export type VegetableMilestoneRecapRow = {
  occurredAt: string;
  title: string;
  subtitleKey: string;
  cultureId: string;
  deleted: boolean;
};

export interface PlantsRecapRepository {
  listCareEventsInRange(from: string, to: string): Promise<PlantCareEventRecapRow[]>;
  listMilestonesInRange(from: string, to: string): Promise<VegetableMilestoneRecapRow[]>;
}
