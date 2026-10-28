import type { PlantsGardenCareProfileRepository } from "@/application/ports/plants-garden-care-profile-repository";
import type { PlantCareProfile } from "@/domain/plant-care-profile";

export type CareProfileUseCasesDeps = {
  careProfiles: PlantsGardenCareProfileRepository;
};

export type CareProfileUseCases = {
  listCareProfiles(): Promise<PlantCareProfile[]>;
  createCareProfile(input: { title: string }): Promise<PlantCareProfile>;
  updateCareProfile(id: string, patch: { title?: string }): Promise<PlantCareProfile>;
  softDeleteCareProfile(id: string): Promise<PlantCareProfile>;
};

export function createCareProfileUseCases(deps: CareProfileUseCasesDeps): CareProfileUseCases {
  return {
    listCareProfiles: () => deps.careProfiles.list(),
    createCareProfile: async () => {
      throw new Error("createCareProfile not implemented");
    },
    updateCareProfile: async () => {
      throw new Error("updateCareProfile not implemented");
    },
    softDeleteCareProfile: async () => {
      throw new Error("softDeleteCareProfile not implemented");
    },
  };
}
