import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createHttpFitnessRemoteStore } from "../adapters/http/fitness-remote-store";
import {
  createIndexedDbFitnessExerciseCatalogStore,
  createIndexedDbFitnessSettingsRepository,
} from "../adapters/indexeddb/fitness-settings-repository";
import { createIndexedDbFitnessSessionTemplateRepository } from "../adapters/indexeddb/fitness-session-template-repository";
import { createIndexedDbFitnessScheduledSessionRepository } from "../adapters/indexeddb/fitness-scheduled-session-repository";
import { createIndexedDbFitnessWorkoutRepository } from "../adapters/indexeddb/fitness-workout-repository";
import { createIndexedDbFitnessSkipRepository } from "../adapters/indexeddb/fitness-skip-repository";
import {
  createFitnessSessionTemplateUseCases,
  type FitnessSessionTemplateUseCases,
} from "../application/fitness/session-template";
import {
  createFitnessScheduleUseCases,
  type FitnessScheduleUseCases,
} from "../application/fitness/schedule";
import { createFitnessWorkoutUseCases, type FitnessWorkoutUseCases } from "../application/fitness/workout";
import { createFitnessSyncApply } from "../application/fitness/sync-apply";
import { createFitnessSyncEngine } from "../application/sync/fitness-sync-engine";
import type { ItemRepository } from "../application/ports/item-repository";
import type { PausableSyncEngine } from "./sync-run";
import type { FitnessUserSettings } from "../domain/fitness/workout-log";
import {
  fetchBundledExerciseCatalog,
  seedExerciseCatalogIfNeeded,
} from "../application/fitness/seed-exercise-catalog";

export type ClientFitnessBundle = {
  fitnessEngine: PausableSyncEngine;
  sessionTemplateUseCases: FitnessSessionTemplateUseCases;
  scheduleUseCases: FitnessScheduleUseCases;
  workoutUseCases: FitnessWorkoutUseCases;
  getUserSettings(): Promise<FitnessUserSettings | undefined>;
  upsertUserSettings(settings: FitnessUserSettings): Promise<FitnessUserSettings>;
  ensureCatalogSeeded(): Promise<void>;
};

const MUTATION_METHODS = [
  "createTemplate",
  "updateTemplate",
  "deleteTemplate",
  "planifier",
  "unplanifier",
  "startWorkoutFromTemplate",
  "startFreeWorkout",
  "completeWorkout",
  "abandonWorkout",
  "skipScheduledSession",
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
  const templates = createIndexedDbFitnessSessionTemplateRepository(deps.db);
  const scheduled = createIndexedDbFitnessScheduledSessionRepository(deps.db);
  const workouts = createIndexedDbFitnessWorkoutRepository(deps.db);
  const skips = createIndexedDbFitnessSkipRepository(deps.db);
  const settings = createIndexedDbFitnessSettingsRepository(deps.db);
  const catalog = createIndexedDbFitnessExerciseCatalogStore(deps.db, deps.items.meta);
  const remote = createHttpFitnessRemoteStore({ fetch: fetchFn, baseUrl });
  const idGenerator = createUuidIdGenerator();
  const now = () => Date.now();

  const syncApply = createFitnessSyncApply({ templates, scheduled, workouts, skips, settings });

  const baseTemplates = createFitnessSessionTemplateUseCases({
    templates,
    meta: deps.items.meta,
    idGenerator,
    now,
  });

  const baseSchedule = createFitnessScheduleUseCases({
    scheduled,
    templates,
    meta: deps.items.meta,
    idGenerator,
    now,
  });

  const baseWorkout = createFitnessWorkoutUseCases({
    workouts,
    templates,
    scheduled,
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

  const wrapWrites = <
    T extends FitnessSessionTemplateUseCases | FitnessScheduleUseCases | FitnessWorkoutUseCases,
  >(
    useCases: T,
  ): T => {
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
    sessionTemplateUseCases: wrapWrites(baseTemplates),
    scheduleUseCases: wrapWrites(baseSchedule),
    workoutUseCases: wrapWrites(baseWorkout),
    getUserSettings: () => settings.get(),
    upsertUserSettings: (row) => settings.upsert(row),
    ensureCatalogSeeded: () =>
      seedExerciseCatalogIfNeeded({
        catalog,
        loadExercises: fetchBundledExerciseCatalog,
      }),
  };
}
