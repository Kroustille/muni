import { describe, expect, it } from "vitest";

import type { ServerPlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { ServerPlantsGardenCareProfileRepository } from "@/application/ports/plants-garden-care-profile-repository";
import type { ServerPlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import type { ServerPlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";
import type { ServerPlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import {
  createPlantsGardenSyncService,
  validatePushPlantsGarden,
} from "@/application/server/plants-garden-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";
import { plantToWire } from "@/domain/plant";
import { plantCareEventToWire } from "@/domain/plant-care-event";
import type { Plant } from "@/domain/plant";
import type { PlantCareEvent } from "@/domain/plant-care-event";

function makeCareEventRepo(initial: PlantCareEvent[] = []): ServerPlantsGardenCareEventRepository {
  const store = new Map(initial.map((e) => [e.id, e]));
  const repo: ServerPlantsGardenCareEventRepository = {
    transaction: async (fn) => fn(repo),
    findByIds: async (_userId, ids) =>
      ids.map((id) => store.get(id)).filter((e): e is PlantCareEvent => e !== undefined),
    findWaterOnDay: async (_userId, plantId, day, excludeId) =>
      [...store.values()].find(
        (e) =>
          e.plantId === plantId &&
          e.eventType === "water" &&
          e.occurredAt === day &&
          e.deletedAt === null &&
          e.id !== excludeId,
      ),
    upsert: async (_userId, row) => {
      store.set(row.id, row);
      return row;
    },
    pullSince: async () => [...store.values()],
    listInRange: async () => [...store.values()],
  };
  return repo;
}

function makePlantRepo(initial: Plant[] = []): ServerPlantsGardenPlantRepository {
  const store = new Map(initial.map((p) => [p.id, p]));
  const repo: ServerPlantsGardenPlantRepository = {
    transaction: async (fn) => fn(repo),
    findByIds: async (_userId, ids) =>
      ids.map((id) => store.get(id)).filter((p): p is Plant => p !== undefined),
    upsert: async (_userId, row) => {
      store.set(row.id, row);
      return row;
    },
    pullSince: async () => [...store.values()],
  };
  return repo;
}

const emptyProfileRepo: ServerPlantsGardenCareProfileRepository = {
  transaction: async (fn) => fn(emptyProfileRepo),
  findByIds: async () => [],
  upsert: async (_u, row) => row,
  pullSince: async () => [],
};

const emptyCultureRepo: ServerPlantsGardenCultureRepository = {
  transaction: async (fn) => fn(emptyCultureRepo),
  findByIds: async () => [],
  upsert: async (_u, row) => row,
  pullSince: async () => [],
};

const emptyMilestoneRepo: ServerPlantsGardenMilestoneRepository = {
  transaction: async (fn) => fn(emptyMilestoneRepo),
  findByIds: async () => [],
  findOnDay: async () => undefined,
  upsert: async (_u, row) => row,
  pullSince: async () => [],
  listInRange: async () => [],
};

describe("plants-garden sync service validation", () => {
  it("validatePushPlantsGarden rejects invalid plant title", () => {
    expect(() =>
      validatePushPlantsGarden({
        plants: [
          {
            id: "11111111-2222-4333-8444-555555555555",
            title: "",
            location_tag: "indoor",
            notes: null,
            care_profile_id: null,
            seasonal_hints: [],
            deleted_at: null,
            fields_updated_at: { title: "t" },
          },
        ],
      }),
    ).toThrow(SyncValidationError);
  });

  it("rejects duplicate water on push", async () => {
    const plantId = "11111111-2222-4333-8444-555555555555";
    const plants = makePlantRepo([
      {
        id: plantId,
        title: "P",
        locationTag: "indoor",
        notes: null,
        careProfileId: null,
        seasonalHints: [],
        deletedAt: null,
        fieldsUpdatedAt: { title: "t" },
      },
    ]);
    const careEvents = makeCareEventRepo([
      {
        id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        plantId,
        eventType: "water",
        occurredAt: "2026-10-20",
        notes: null,
        seasonalHintId: null,
        deletedAt: null,
        fieldsUpdatedAt: { occurredAt: "t" },
      },
    ]);
    const sync = createPlantsGardenSyncService({
      plants,
      careEvents,
      careProfiles: emptyProfileRepo,
      cultures: emptyCultureRepo,
      milestones: emptyMilestoneRepo,
      now: () => new Date("2026-10-20T12:00:00Z"),
    });
    const wire = plantCareEventToWire({
      id: "bbbbbbbb-bbbb-4ccc-8ddd-ffffffffffff",
      plantId,
      eventType: "water",
      occurredAt: "2026-10-20",
      notes: null,
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "t" },
    });
    await expect(
      sync.push("user-1", { plants: [], careEvents: [wire], careProfiles: [], cultures: [], milestones: [] }),
    ).rejects.toBeInstanceOf(SyncValidationError);
  });

  it("merges plant on push and pull", async () => {
    const plants = makePlantRepo();
    const sync = createPlantsGardenSyncService({
      plants,
      careEvents: makeCareEventRepo(),
      careProfiles: emptyProfileRepo,
      cultures: emptyCultureRepo,
      milestones: emptyMilestoneRepo,
      now: () => new Date("2026-01-01T12:00:00Z"),
    });
    const wire = plantToWire({
      id: "11111111-2222-4333-8444-555555555555",
      title: "Basilic",
      locationTag: "outdoor",
      notes: null,
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "2026-01-01T12:00:00.000Z-0-dev" },
    });
    await sync.push("user-1", { plants: [wire], careEvents: [], careProfiles: [], cultures: [], milestones: [] });
    const pulled = await sync.pull("user-1", null, 50);
    expect(pulled.plants.some((p) => p.id === wire.id)).toBe(true);
  });

  it("pushes all entity arrays", async () => {
    const plants = makePlantRepo();
    const careEvents = makeCareEventRepo();
    const sync = createPlantsGardenSyncService({
      plants,
      careEvents,
      careProfiles: emptyProfileRepo,
      cultures: emptyCultureRepo,
      milestones: emptyMilestoneRepo,
      now: () => new Date("2026-01-01T12:00:00Z"),
    });
    const plantWire = plantToWire({
      id: "11111111-2222-4333-8444-555555555555",
      title: "Basilic",
      locationTag: "outdoor",
      notes: null,
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "t" },
    });
    const eventWire = plantCareEventToWire({
      id: "22222222-3333-4333-8444-555555555555",
      plantId: plantWire.id,
      eventType: "prune",
      occurredAt: "2026-08-01",
      notes: "ok",
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "t" },
    });
    const result = await sync.push("user-1", {
      plants: [plantWire],
      careEvents: [eventWire],
      careProfiles: [
        {
          id: "33333333-4444-4333-8444-555555555555",
          title: "Tropical",
          seasonal_hints: [],
          deleted_at: null,
          fields_updated_at: { title: "t" },
        },
      ],
      cultures: [
        {
          id: "44444444-5555-4333-8444-555555555555",
          title: "Tomates",
          location_note: null,
          variety: null,
          notes: null,
          plant_id: null,
          deleted_at: null,
          fields_updated_at: { title: "t" },
        },
      ],
      milestones: [
        {
          id: "55555555-6666-4333-8444-555555555555",
          culture_id: "44444444-5555-4333-8444-555555555555",
          milestone_type: "sow",
          occurred_at: "2026-05-01",
          notes: null,
          deleted_at: null,
          fields_updated_at: { occurred_at: "t" },
        },
      ],
    });
    expect(result.plants).toHaveLength(1);
    expect(result.careEvents).toHaveLength(1);
    expect(result.careProfiles).toHaveLength(1);
    expect(result.cultures).toHaveLength(1);
    expect(result.milestones).toHaveLength(1);
  });
});
