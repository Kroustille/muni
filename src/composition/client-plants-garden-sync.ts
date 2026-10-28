import { createHttpPlantsGardenRemoteStore } from "../adapters/http/plants-garden-remote-store";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createIndexedDbPlantsGardenPlantRepository } from "../adapters/indexeddb/plants-garden-plant-repository";
import { createIndexedDbPlantsGardenCareEventRepository } from "../adapters/indexeddb/plants-garden-care-event-repository";
import { createIndexedDbPlantsGardenCareProfileRepository } from "../adapters/indexeddb/plants-garden-care-profile-repository";
import { createIndexedDbPlantsGardenCultureRepository } from "../adapters/indexeddb/plants-garden-culture-repository";
import { createIndexedDbPlantsGardenMilestoneRepository } from "../adapters/indexeddb/plants-garden-milestone-repository";
import { createPlantsGardenSyncApply } from "../application/plants-garden/sync-apply";
import { createPlantsGardenSyncEngine } from "../application/sync/plants-garden-sync-engine";
import { createPlantUseCases, type PlantUseCases } from "../application/plants-garden/plant-use-cases";
import {
  createRecordCareEventUseCases,
  type RecordCareEventUseCases,
} from "../application/plants-garden/record-care-event";
import { createCultureUseCases, type CultureUseCases } from "../application/plants-garden/culture-use-cases";
import { createCareProfileUseCases, type CareProfileUseCases } from "../application/plants-garden/care-profile";
import type { ItemRepository } from "../application/ports/item-repository";
import type { PausableSyncEngine } from "./sync-run";

export type ClientPlantsGardenBundle = {
  plantsGardenEngine: PausableSyncEngine;
  plantUseCases: PlantUseCases;
  recordCareEvent: RecordCareEventUseCases;
  cultureUseCases: CultureUseCases;
  careProfileUseCases: CareProfileUseCases;
};

const PLANT_MUTATIONS = ["createPlant", "updatePlant", "softDeletePlant"] as const;
const CARE_MUTATIONS = ["recordPlantWatered", "recordCareEvent"] as const;
const CULTURE_MUTATIONS = ["createCulture", "updateCulture", "softDeleteCulture"] as const;
const PROFILE_MUTATIONS = ["createCareProfile", "updateCareProfile", "softDeleteCareProfile"] as const;

export function wireClientPlantsGardenSync(deps: {
  db: MuniDb;
  items: ItemRepository;
  pullLimit: number;
  onLocalWrite: () => void;
  fetch?: typeof fetch;
  baseUrl?: string;
}): ClientPlantsGardenBundle {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = deps.baseUrl ?? "";
  const plants = createIndexedDbPlantsGardenPlantRepository(deps.db);
  const careEvents = createIndexedDbPlantsGardenCareEventRepository(deps.db);
  const careProfiles = createIndexedDbPlantsGardenCareProfileRepository(deps.db);
  const cultures = createIndexedDbPlantsGardenCultureRepository(deps.db);
  const milestones = createIndexedDbPlantsGardenMilestoneRepository(deps.db);
  const remote = createHttpPlantsGardenRemoteStore({ fetch: fetchFn, baseUrl });
  const syncApply = createPlantsGardenSyncApply({
    plants,
    careEvents,
    careProfiles,
    cultures,
    milestones,
  });

  const plantsGardenEngine = createPlantsGardenSyncEngine({
    meta: deps.items.meta,
    remote,
    sync: syncApply,
    pullLimit: deps.pullLimit,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });

  const wrapWrites = <T extends Record<string, unknown>>(useCases: T, methods: readonly string[]): T => {
    const wrapped = { ...useCases } as Record<string, unknown>;
    for (const key of methods) {
      const fn = useCases[key];
      if (typeof fn !== "function") continue;
      wrapped[key] = async (...args: unknown[]) => {
        const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
        deps.onLocalWrite();
        return result;
      };
    }
    return wrapped as T;
  };

  const basePlant = createPlantUseCases({ plants });
  const baseCare = createRecordCareEventUseCases({ careEvents });
  const baseCulture = createCultureUseCases({ cultures });
  const baseProfile = createCareProfileUseCases({ careProfiles });

  return {
    plantsGardenEngine,
    plantUseCases: wrapWrites(basePlant, PLANT_MUTATIONS),
    recordCareEvent: wrapWrites(baseCare, CARE_MUTATIONS),
    cultureUseCases: wrapWrites(baseCulture, CULTURE_MUTATIONS),
    careProfileUseCases: wrapWrites(baseProfile, PROFILE_MUTATIONS),
  };
}
