import type { PlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import type { Plant } from "@/domain/plant";

export type PlantUseCasesDeps = {
  plants: PlantsGardenPlantRepository;
};

export type PlantUseCases = {
  listPlants(): Promise<Plant[]>;
  createPlant(input: { title: string }): Promise<Plant>;
  updatePlant(id: string, patch: { title?: string }): Promise<Plant>;
  softDeletePlant(id: string): Promise<Plant>;
};

export function createPlantUseCases(deps: PlantUseCasesDeps): PlantUseCases {
  return {
    listPlants: () => deps.plants.list(),
    createPlant: async () => {
      throw new Error("createPlant not implemented");
    },
    updatePlant: async () => {
      throw new Error("updatePlant not implemented");
    },
    softDeletePlant: async () => {
      throw new Error("softDeletePlant not implemented");
    },
  };
}
