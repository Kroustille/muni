import type {
  PlantsGardenPlantRepository,
  Unsubscribe,
} from "@/application/ports/plants-garden-plant-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import { createFitnessHlc } from "@/application/fitness/hlc";
import { localCalendarDate } from "@/application/fitness/today";
import {
  plantSchema,
  validatePlantTitle,
  type Plant,
  type PlantLocationTag,
} from "@/domain/plant";

export type PlantUseCasesDeps = {
  plants: PlantsGardenPlantRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type PlantUseCases = {
  listPlants(): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | undefined>;
  createPlant(input: { title: string }): Promise<Plant>;
  updatePlant(
    id: string,
    patch: { title?: string; locationTag?: PlantLocationTag; notes?: string | null; seasonalHints?: Plant["seasonalHints"] },
  ): Promise<Plant>;
  softDeletePlant(id: string): Promise<Plant>;
  subscribe(listener: () => void): Unsubscribe;
};

export function createPlantUseCases(deps: PlantUseCasesDeps): PlantUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);

  return {
    listPlants: () => deps.plants.list(),
    getPlant: (id) => deps.plants.get(id),

    async createPlant(input) {
      const titleErr = validatePlantTitle(input.title);
      if (titleErr !== null) throw new Error(titleErr);
      const stamp = await hlc.nextFieldStamp();
      const plant = plantSchema.parse({
        id: deps.idGenerator.newId(),
        title: input.title.trim(),
        locationTag: "indoor",
        notes: null,
        careProfileId: null,
        seasonalHints: [],
        deletedAt: null,
        fieldsUpdatedAt: {
          title: stamp,
          locationTag: stamp,
          notes: stamp,
          careProfileId: stamp,
          seasonalHints: stamp,
        },
      }) as Plant;
      return deps.plants.upsert(plant);
    },

    async updatePlant(id, patch) {
      const current = await deps.plants.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("plant not found");
      const stamp = await hlc.nextFieldStamp();
      const fieldsUpdatedAt = { ...current.fieldsUpdatedAt };
      const next: Plant = { ...current };
      if (patch.title !== undefined) {
        const err = validatePlantTitle(patch.title);
        if (err !== null) throw new Error(err);
        next.title = patch.title.trim();
        fieldsUpdatedAt.title = stamp;
      }
      if (patch.locationTag !== undefined) {
        next.locationTag = patch.locationTag;
        fieldsUpdatedAt.locationTag = stamp;
      }
      if (patch.notes !== undefined) {
        next.notes = patch.notes;
        fieldsUpdatedAt.notes = stamp;
      }
      if (patch.seasonalHints !== undefined) {
        next.seasonalHints = patch.seasonalHints;
        fieldsUpdatedAt.seasonalHints = stamp;
      }
      next.fieldsUpdatedAt = fieldsUpdatedAt;
      return deps.plants.upsert(plantSchema.parse(next) as Plant);
    },

    async softDeletePlant(id) {
      const current = await deps.plants.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("plant not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.plants.upsert({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },

    subscribe: (listener) => deps.plants.subscribe(listener),
  };
}

export function formatLastWateredLabel(lastDate: string | null, today: string = localCalendarDate()): string {
  if (lastDate === null) return "—";
  return lastDate === today ? "aujourd'hui" : lastDate;
}
