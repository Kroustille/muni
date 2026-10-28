import { openMuniDb } from "@/adapters/indexeddb/db";
const MUNI_DB = "muni";
import { createIndexedDbFitnessWorkoutRepository } from "@/adapters/indexeddb/fitness-workout-repository";
import { createIndexedDbItemRepository } from "@/adapters/indexeddb/item-repository";
import { createIndexedDbPlantsGardenCareEventRepository } from "@/adapters/indexeddb/plants-garden-care-event-repository";
import { createIndexedDbPlantsGardenCultureRepository } from "@/adapters/indexeddb/plants-garden-culture-repository";
import { createIndexedDbPlantsGardenMilestoneRepository } from "@/adapters/indexeddb/plants-garden-milestone-repository";
import { createIndexedDbPlantsGardenPlantRepository } from "@/adapters/indexeddb/plants-garden-plant-repository";
import { createPlantsRecapRepository } from "@/application/plants-garden/plants-recap-query";
import { createRecapUseCases, type RecapUseCases } from "@/application/recap/recap-use-cases";
import { emptyMusicPracticeRecapRepository } from "@/application/ports/music-practice-recap-repository";
import { recordRecipeCooked, type RecordRecipeCookedInput } from "@/application/recipes/record-cooked";

let recapUseCases: Promise<RecapUseCases> | undefined;

async function buildRecapDeps() {
  const db = await openMuniDb(MUNI_DB);
  const items = createIndexedDbItemRepository(db);
  return {
    items,
    fitnessWorkouts: createIndexedDbFitnessWorkoutRepository(db),
    musicPractice: emptyMusicPracticeRecapRepository,
    plants: createPlantsRecapRepository({
      plants: createIndexedDbPlantsGardenPlantRepository(db),
      careEvents: createIndexedDbPlantsGardenCareEventRepository(db),
      cultures: createIndexedDbPlantsGardenCultureRepository(db),
      milestones: createIndexedDbPlantsGardenMilestoneRepository(db),
    }),
  };
}

export function getRecapUseCases(): Promise<RecapUseCases> {
  recapUseCases ??= buildRecapDeps().then((deps) => createRecapUseCases(deps));
  return recapUseCases;
}

export async function recordRecipeCookedOnClient(input: RecordRecipeCookedInput) {
  const deps = await buildRecapDeps();
  return recordRecipeCooked(deps.items, input);
}
