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
          const parentDeleted = plant.deletedAt !== null;
          if (parentDeleted) return null;
          return {
            id: event.id,
            plantId: plant.id,
            occurredAt: event.occurredAt,
            title: plant.title,
            subtitleKey: careEventRecapSubtitleKey(event.eventType),
            parentDeleted: false,
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
          const parentDeleted = culture.deletedAt !== null;
          if (parentDeleted) return null;
          return {
            id: milestone.id,
            cultureId: culture.id,
            occurredAt: milestone.occurredAt,
            title: culture.title,
            subtitleKey: milestoneRecapSubtitleKey(milestone.milestoneType),
            parentDeleted: false,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
    },
  };
}
