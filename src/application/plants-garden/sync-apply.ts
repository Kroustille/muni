import { plantToWire, wireToPlant, type PlantWire } from "@/domain/plant";
import {
  plantCareEventToWire,
  wireToPlantCareEvent,
  type PlantCareEventWire,
} from "@/domain/plant-care-event";
import {
  plantCareProfileToWire,
  wireToPlantCareProfile,
  type PlantCareProfileWire,
} from "@/domain/plant-care-profile";
import {
  vegetableCultureToWire,
  wireToVegetableCulture,
  type VegetableCultureWire,
} from "@/domain/vegetable-culture";
import {
  vegetableMilestoneToWire,
  wireToVegetableMilestone,
  type VegetableMilestoneWire,
} from "@/domain/vegetable-milestone";
import type { PlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import type { PlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { PlantsGardenCareProfileRepository } from "@/application/ports/plants-garden-care-profile-repository";
import type { PlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import type { PlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";

export type PlantsGardenSyncApplyDeps = {
  plants: PlantsGardenPlantRepository;
  careEvents: PlantsGardenCareEventRepository;
  careProfiles: PlantsGardenCareProfileRepository;
  cultures: PlantsGardenCultureRepository;
  milestones: PlantsGardenMilestoneRepository;
};

export type PlantsGardenSyncApply = {
  applyRemote(payload: {
    plants: PlantWire[];
    careEvents: PlantCareEventWire[];
    careProfiles: PlantCareProfileWire[];
    cultures: VegetableCultureWire[];
    milestones: VegetableMilestoneWire[];
  }): Promise<void>;
  collectPushPayload(): Promise<{
    plants: PlantWire[];
    careEvents: PlantCareEventWire[];
    careProfiles: PlantCareProfileWire[];
    cultures: VegetableCultureWire[];
    milestones: VegetableMilestoneWire[];
  }>;
  clearOutboxes(payload: {
    plantIds: string[];
    careEventIds: string[];
    careProfileIds: string[];
    cultureIds: string[];
    milestoneIds: string[];
  }): Promise<void>;
};

export function createPlantsGardenSyncApply(deps: PlantsGardenSyncApplyDeps): PlantsGardenSyncApply {
  return {
    async applyRemote(payload) {
      for (const wire of payload.plants) {
        await deps.plants.upsert(wireToPlant(wire), { enqueue: false });
      }
      for (const wire of payload.careEvents) {
        await deps.careEvents.upsert(wireToPlantCareEvent(wire), { enqueue: false });
      }
      for (const wire of payload.careProfiles) {
        await deps.careProfiles.upsert(wireToPlantCareProfile(wire), { enqueue: false });
      }
      for (const wire of payload.cultures) {
        await deps.cultures.upsert(wireToVegetableCulture(wire), { enqueue: false });
      }
      for (const wire of payload.milestones) {
        await deps.milestones.upsert(wireToVegetableMilestone(wire), { enqueue: false });
      }
    },

    async collectPushPayload() {
      const [plantIds, careEventIds, careProfileIds, cultureIds, milestoneIds] = await Promise.all([
        deps.plants.outbox(),
        deps.careEvents.outbox(),
        deps.careProfiles.outbox(),
        deps.cultures.outbox(),
        deps.milestones.outbox(),
      ]);
      const plants = (
        await Promise.all(plantIds.map((id) => deps.plants.get(id)))
      ).filter((p): p is NonNullable<typeof p> => p !== undefined);
      const careEvents = (
        await Promise.all(careEventIds.map((id) => deps.careEvents.get(id)))
      ).filter((e): e is NonNullable<typeof e> => e !== undefined);
      const careProfiles = (
        await Promise.all(careProfileIds.map((id) => deps.careProfiles.get(id)))
      ).filter((p): p is NonNullable<typeof p> => p !== undefined);
      const cultures = (
        await Promise.all(cultureIds.map((id) => deps.cultures.get(id)))
      ).filter((c): c is NonNullable<typeof c> => c !== undefined);
      const milestones = (
        await Promise.all(milestoneIds.map((id) => deps.milestones.get(id)))
      ).filter((m): m is NonNullable<typeof m> => m !== undefined);
      return {
        plants: plants.map((p) => plantToWire(p)),
        careEvents: careEvents.map((e) => plantCareEventToWire(e)),
        careProfiles: careProfiles.map((p) => plantCareProfileToWire(p)),
        cultures: cultures.map((c) => vegetableCultureToWire(c)),
        milestones: milestones.map((m) => vegetableMilestoneToWire(m)),
      };
    },

    async clearOutboxes(payload) {
      await Promise.all([
        deps.plants.clearOutbox(payload.plantIds),
        deps.careEvents.clearOutbox(payload.careEventIds),
        deps.careProfiles.clearOutbox(payload.careProfileIds),
        deps.cultures.clearOutbox(payload.cultureIds),
        deps.milestones.clearOutbox(payload.milestoneIds),
      ]);
    },
  };
}
