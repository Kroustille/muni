import type { PlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import type { VegetableCulture } from "@/domain/vegetable-culture";

export type CultureUseCasesDeps = {
  cultures: PlantsGardenCultureRepository;
};

export type CultureUseCases = {
  listCultures(): Promise<VegetableCulture[]>;
  createCulture(input: { title: string }): Promise<VegetableCulture>;
  updateCulture(id: string, patch: { title?: string }): Promise<VegetableCulture>;
  softDeleteCulture(id: string): Promise<VegetableCulture>;
};

export function createCultureUseCases(deps: CultureUseCasesDeps): CultureUseCases {
  return {
    listCultures: () => deps.cultures.list(),
    createCulture: async () => {
      throw new Error("createCulture not implemented");
    },
    updateCulture: async () => {
      throw new Error("updateCulture not implemented");
    },
    softDeleteCulture: async () => {
      throw new Error("softDeleteCulture not implemented");
    },
  };
}
