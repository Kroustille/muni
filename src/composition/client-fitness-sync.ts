import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createHttpFitnessRemoteStore } from "../adapters/http/fitness-remote-store";
import {
  createIndexedDbFitnessExerciseCatalogStore,
  createIndexedDbFitnessSettingsRepository,
} from "../adapters/indexeddb/fitness-settings-repository";
import { createIndexedDbFitnessProgramRepository } from "../adapters/indexeddb/fitness-program-repository";
import { createIndexedDbFitnessWorkoutRepository } from "../adapters/indexeddb/fitness-workout-repository";
import { createIndexedDbFitnessSkipRepository } from "../adapters/indexeddb/fitness-skip-repository";
import {
  defaultFitnessUserSettings,
  type FitnessUserSettings,
} from "../domain/fitness/workout-log";
import { createFitnessProgramUseCases, type FitnessProgramUseCases } from "../application/fitness/program";
import { createFitnessWorkoutUseCases, type FitnessWorkoutUseCases } from "../application/fitness/workout";
import { createFitnessSyncApply } from "../application/fitness/sync-apply";
import { createFitnessSyncEngine } from "../application/sync/fitness-sync-engine";
import type { ItemRepository } from "../application/ports/item-repository";
import type { PausableSyncEngine } from "./sync-run";
import {
  fetchBundledExerciseCatalog,
  seedExerciseCatalogIfNeeded,
} from "../application/fitness/seed-exercise-catalog";

export type ClientFitnessBundle = {
  fitnessEngine: PausableSyncEngine;
  programUseCases: FitnessProgramUseCases;
  workoutUseCases: FitnessWorkoutUseCases;
  getUserSettings(): Promise<FitnessUserSettings>;
  saveUserSettings(settings: FitnessUserSettings): Promise<FitnessUserSettings>;
  ensureCatalogSeeded(): Promise<void>;
};

const MUTATION_METHODS = [
  "createProgram",
  "updateProgram",
  "startWorkoutFromPlan",
  "startFreeWorkout",
  "completeWorkout",
  "abandonWorkout",
  "skipPlannedSession",
  "updateLoggedExercises",
  "updateRecovery",
  "duplicateWorkoutAsTemplate",
  "deleteWorkout",
] as const;

export function wireClientFitnessSync(deps: {
  db: MuniDb;
  items: ItemRepository;
  pullLimit: number;
  onLocalWrite: () => void;
  fetch?: typeof fetch;
  baseUrl?: string;
}): ClientFitnessBundle {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = deps.baseUrl ?? "";
  const programs = createIndexedDbFitnessProgramRepository(deps.db);
  const workouts = createIndexedDbFitnessWorkoutRepository(deps.db);
  const skips = createIndexedDbFitnessSkipRepository(deps.db);
  const settings = createIndexedDbFitnessSettingsRepository(deps.db);
  const catalog = createIndexedDbFitnessExerciseCatalogStore(deps.db, deps.items.meta);
  const remote = createHttpFitnessRemoteStore({ fetch: fetchFn, baseUrl });
  const idGenerator = createUuidIdGenerator();
  const now = () => Date.now();

  const syncApply = createFitnessSyncApply({ programs, workouts, skips, settings });

  const baseProgram = createFitnessProgramUseCases({
    programs,
    meta: deps.items.meta,
    idGenerator,
    now,
  });

  const baseWorkout = createFitnessWorkoutUseCases({
    workouts,
    programs,
    skips,
    settings,
    catalog,
    meta: deps.items.meta,
    idGenerator,
    now,
  });

  const fitnessEngine = createFitnessSyncEngine({
    meta: deps.items.meta,
    remote,
    sync: syncApply,
    pullLimit: deps.pullLimit,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });

  const wrapWrites = <T extends FitnessProgramUseCases | FitnessWorkoutUseCases>(useCases: T): T => {
    const wrapped = { ...useCases };
    for (const key of MUTATION_METHODS) {
      const fn = (useCases as Record<string, unknown>)[key];
      if (typeof fn !== "function") continue;
      (wrapped as Record<string, unknown>)[key] = async (...args: unknown[]) => {
        const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
        deps.onLocalWrite();
        return result;
      };
    }
    return wrapped;
  };

  return {
    fitnessEngine,
    programUseCases: wrapWrites(baseProgram),
    workoutUseCases: wrapWrites(baseWorkout),
    getUserSettings: async () => (await settings.get()) ?? defaultFitnessUserSettings(),
    saveUserSettings: async (row) => {
      const saved = await settings.upsert(row);
      deps.onLocalWrite();
      return saved;
    },
    ensureCatalogSeeded: () =>
      seedExerciseCatalogIfNeeded({
        catalog,
        loadExercises: fetchBundledExerciseCatalog,
      }),
  };
}
