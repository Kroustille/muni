import type { PlantsGardenCareProfileRepository } from "@/application/ports/plants-garden-care-profile-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import { createFitnessHlc } from "@/application/fitness/hlc";
import { plantCareProfileSchema, type PlantCareProfile } from "@/domain/plant-care-profile";
import type { PlantSeasonalHint } from "@/domain/plant";

export type CareProfileUseCasesDeps = {
  careProfiles: PlantsGardenCareProfileRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type CareProfileUseCases = {
  listCareProfiles(): Promise<PlantCareProfile[]>;
  createCareProfile(input: { title: string; seasonalHints?: PlantSeasonalHint[] }): Promise<PlantCareProfile>;
  updateCareProfile(
    id: string,
    patch: { title?: string; seasonalHints?: PlantSeasonalHint[] },
  ): Promise<PlantCareProfile>;
  softDeleteCareProfile(id: string): Promise<PlantCareProfile>;
  copyHintsToPlantHints(profile: PlantCareProfile, idGenerator: IdGenerator): PlantSeasonalHint[];
};

export function createCareProfileUseCases(deps: CareProfileUseCasesDeps): CareProfileUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);

  return {
    listCareProfiles: () => deps.careProfiles.list(),

    async createCareProfile(input) {
      const title = input.title.trim();
      if (title.length < 1 || title.length > 300) throw new Error("title length 1-300");
      const stamp = await hlc.nextFieldStamp();
      const profile = plantCareProfileSchema.parse({
        id: deps.idGenerator.newId(),
        title,
        seasonalHints: input.seasonalHints ?? [],
        deletedAt: null,
        fieldsUpdatedAt: { title: stamp, seasonalHints: stamp },
      }) as PlantCareProfile;
      return deps.careProfiles.upsert(profile);
    },

    async updateCareProfile(id, patch) {
      const current = await deps.careProfiles.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("profile not found");
      const stamp = await hlc.nextFieldStamp();
      const fieldsUpdatedAt = { ...current.fieldsUpdatedAt };
      const next: PlantCareProfile = { ...current };
      if (patch.title !== undefined) {
        next.title = patch.title.trim();
        fieldsUpdatedAt.title = stamp;
      }
      if (patch.seasonalHints !== undefined) {
        next.seasonalHints = patch.seasonalHints;
        fieldsUpdatedAt.seasonalHints = stamp;
      }
      next.fieldsUpdatedAt = fieldsUpdatedAt;
      return deps.careProfiles.upsert(plantCareProfileSchema.parse(next) as PlantCareProfile);
    },

    async softDeleteCareProfile(id) {
      const current = await deps.careProfiles.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("profile not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.careProfiles.upsert({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },

    copyHintsToPlantHints(profile, idGenerator) {
      return profile.seasonalHints.map((hint, index) => ({
        ...hint,
        id: idGenerator.newId(),
        sortOrder: index,
      }));
    },
  };
}
