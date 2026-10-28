import { openMuniDb } from "@/adapters/indexeddb/db";
const MUNI_DB = "muni";
import { createIndexedDbFitnessWorkoutRepository } from "@/adapters/indexeddb/fitness-workout-repository";
import { createIndexedDbItemRepository } from "@/adapters/indexeddb/item-repository";
import { createRecapUseCases, type RecapUseCases } from "@/application/recap/recap-use-cases";
import { emptyMusicPracticeRecapRepository } from "@/application/ports/music-practice-recap-repository";
import { emptyPlantsRecapRepository } from "@/application/ports/plants-recap-repository";
import { recordRecipeCooked, type RecordRecipeCookedInput } from "@/application/recipes/record-cooked";

let recapUseCases: Promise<RecapUseCases> | undefined;

async function buildRecapDeps() {
  const db = await openMuniDb(MUNI_DB);
  return {
    items: createIndexedDbItemRepository(db),
    fitnessWorkouts: createIndexedDbFitnessWorkoutRepository(db),
    musicPractice: emptyMusicPracticeRecapRepository,
    plants: emptyPlantsRecapRepository,
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
