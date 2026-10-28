export type PlantCareEventRecapRow = {
  id: string;
  plantId: string;
  occurredAt: string;
  title: string;
  subtitleKey: string;
  parentDeleted: boolean;
};

export type VegetableMilestoneRecapRow = {
  id: string;
  cultureId: string;
  occurredAt: string;
  title: string;
  subtitleKey: string;
  parentDeleted: boolean;
};

export type PlantsRecapRepository = {
  listCareEventsInRange(from: string, to: string): Promise<PlantCareEventRecapRow[]>;
  listMilestonesInRange(from: string, to: string): Promise<VegetableMilestoneRecapRow[]>;
};

export const emptyPlantsRecapRepository: PlantsRecapRepository = {
  async listCareEventsInRange() {
    return [];
  },
  async listMilestonesInRange() {
    return [];
  },
};
