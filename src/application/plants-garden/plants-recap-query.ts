import type { PlantsRecapRepository } from "@/application/ports/plants-recap-repository";
import type { PlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { PlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";
import type { PlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import type { PlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import { careEventRecapSubtitleKey } from "@/domain/plant-care-event";
import { milestoneRecapSubtitleKey } from "@/domain/vegetable-milestone";

export type PlantsRecapQueryDeps = {
  plants: PlantsGardenPlantRepository;
  careEvents: PlantsGardenCareEventRepository;
  cultures: PlantsGardenCultureRepository;
  milestones: PlantsGardenMilestoneRepository;
};

export function createPlantsRecapRepository(deps: PlantsRecapQueryDeps): PlantsRecapRepository {
  return {
    async listCareEventsInRange(from, to) {
      const [events, plants] = await Promise.all([
        deps.careEvents.listInRange(from, to),
        deps.plants.list(true),
      ]);
      const plantById = new Map(plants.map((p) => [p.id, p]));
      return events
        .map((event) => {
          const plant = plantById.get(event.plantId);
          if (plant === undefined) return null;
          const deleted = plant.deletedAt !== null;
          if (deleted) return null;
          return {
            occurredAt: event.occurredAt,
            title: plant.title,
            subtitleKey: careEventRecapSubtitleKey(event.eventType),
            plantId: plant.id,
            deleted: false,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
    },

    async listMilestonesInRange(from, to) {
      const [milestones, cultures] = await Promise.all([
        deps.milestones.listInRange(from, to),
        deps.cultures.list(),
      ]);
      const cultureById = new Map(cultures.map((c) => [c.id, c]));
      return milestones
        .map((milestone) => {
          const culture = cultureById.get(milestone.cultureId);
          if (culture === undefined) return null;
          if (culture.deletedAt !== null) return null;
          return {
            occurredAt: milestone.occurredAt,
            title: culture.title,
            subtitleKey: milestoneRecapSubtitleKey(milestone.milestoneType),
            cultureId: culture.id,
            deleted: false,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
    },
  };
}
