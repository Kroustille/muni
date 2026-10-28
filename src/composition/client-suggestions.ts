import { createIndexedDbActivitySuggestionStore } from "@/adapters/indexeddb/activity-suggestion-store";
import { createIndexedDbFitnessProgramRepository } from "@/adapters/indexeddb/fitness-program-repository";
import { createIndexedDbFitnessSkipRepository } from "@/adapters/indexeddb/fitness-skip-repository";
import { createIndexedDbFitnessWorkoutRepository } from "@/adapters/indexeddb/fitness-workout-repository";
import type { MuniDb } from "@/adapters/indexeddb/db";
import type { ItemRepository } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  createSuggestionsUseCases,
  type SuggestionsUseCases,
} from "@/application/suggestions/use-cases";
import type { SuggestionsDeps } from "@/application/suggestions/build-daily-suggestions";

export function wireClientSuggestions(input: {
  db: MuniDb;
  items: ItemRepository;
  idGenerator: IdGenerator;
  now: () => number;
}): { suggestionsUseCases: SuggestionsUseCases; deps: SuggestionsDeps } {
  const suggestionStore = createIndexedDbActivitySuggestionStore(input.db);
  const deps: SuggestionsDeps = {
    items: input.items,
    suggestionStore,
    fitnessPrograms: createIndexedDbFitnessProgramRepository(input.db),
    fitnessWorkouts: createIndexedDbFitnessWorkoutRepository(input.db),
    fitnessSkips: createIndexedDbFitnessSkipRepository(input.db),
    idGenerator: input.idGenerator,
    now: input.now,
  };
  return {
    deps,
    suggestionsUseCases: createSuggestionsUseCases(deps),
  };
}
