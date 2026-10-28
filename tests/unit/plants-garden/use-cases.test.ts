import { describe, expect, it } from "vitest";

import { createCareProfileUseCases } from "@/application/plants-garden/care-profile";
import { createCultureUseCases } from "@/application/plants-garden/culture-use-cases";
import { createPlantUseCases } from "@/application/plants-garden/plant-use-cases";
import { createPlantsRecapRepository } from "@/application/plants-garden/plants-recap-query";
import { createRecordCareEventUseCases } from "@/application/plants-garden/record-care-event";
import { createPlantsGardenSyncApply } from "@/application/plants-garden/sync-apply";
import type { Plant } from "@/domain/plant";
import type { PlantCareEvent } from "@/domain/plant-care-event";
import type { PlantCareProfile } from "@/domain/plant-care-profile";
import type { VegetableCulture } from "@/domain/vegetable-culture";
import type { VegetableMilestone } from "@/domain/vegetable-milestone";

function memoryMeta() {
  const data = new Map<string, unknown>();
  return {
    get: async (key: string) => data.get(key) as never,
    set: async (key: string, value: unknown) => {
      data.set(key, value);
    },
  };
}

function mapRepo<T extends { id: string }>() {
  const store = new Map<string, T>();
  return {
    store,
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: T) => {
      store.set(row.id, row);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([...store.keys()]),
    clearOutbox: () => Promise.resolve(),
  };
}

const idGen = { newId: () => crypto.randomUUID() };
const now = () => new Date("2026-10-20T12:00:00Z").getTime();

describe("plants-garden use cases", () => {
  it("creates plant with indoor default", async () => {
    const plants = mapRepo<Plant>();
    const uc = createPlantUseCases({ plants, meta: memoryMeta(), idGenerator: idGen, now });
    const plant = await uc.createPlant({ title: "  Monstera  " });
    expect(plant.title).toBe("Monstera");
    expect(plant.locationTag).toBe("indoor");
  });

  it("updates location and soft deletes", async () => {
    const plants = mapRepo<Plant>();
    const uc = createPlantUseCases({ plants, meta: memoryMeta(), idGenerator: idGen, now });
    const plant = await uc.createPlant({ title: "Orchidée" });
    const updated = await uc.updatePlant(plant.id, { locationTag: "both", notes: "Humide" });
    expect(updated.locationTag).toBe("both");
    const deleted = await uc.softDeletePlant(plant.id);
    expect(deleted.deletedAt).not.toBeNull();
  });

  it("allows fertilize same day as water", async () => {
    const plants = mapRepo<Plant>();
    const events = mapRepo<PlantCareEvent>();
    const plant = await createPlantUseCases({ plants, meta: memoryMeta(), idGenerator: idGen, now }).createPlant({
      title: "Ficus",
    });
    const care = createRecordCareEventUseCases({
      careEvents: {
        ...events,
        listByPlant: async (plantId) => [...events.store.values()].filter((e) => e.plantId === plantId),
        listAll: () => Promise.resolve([...events.store.values()]),
        listInRange: async (from, to) =>
          [...events.store.values()].filter((e) => e.occurredAt >= from && e.occurredAt <= to),
      },
      plants,
      meta: memoryMeta(),
      idGenerator: idGen,
      now,
    });
    const first = await care.recordPlantWatered(plant.id, "2026-10-20");
    const second = await care.recordPlantWatered(plant.id, "2026-10-20");
    expect(first.kind).toBe("created");
    expect(second.kind).toBe("deduped");
    const fert = await care.recordCareEvent({
      plantId: plant.id,
      eventType: "fertilize",
      occurredAt: "2026-10-20",
    });
    expect(fert.kind).toBe("created");
    expect(await care.lastWateredForPlant(plant.id)).toBe("2026-10-20");
  });

  it("records culture milestone with dedupe", async () => {
    const cultures = mapRepo<VegetableCulture>();
    const milestones = mapRepo<VegetableMilestone>();
    const uc = createCultureUseCases({
      cultures,
      milestones: {
        ...milestones,
        listByCulture: async (cultureId) =>
          [...milestones.store.values()].filter((m) => m.cultureId === cultureId),
        listAll: () => Promise.resolve([...milestones.store.values()]),
        listInRange: async (from, to) =>
          [...milestones.store.values()].filter((m) => m.occurredAt >= from && m.occurredAt <= to),
      },
      meta: memoryMeta(),
      idGenerator: idGen,
      now,
    });
    const culture = await uc.createCulture({ title: "Tomates" });
    const a = await uc.recordMilestone({ cultureId: culture.id, milestoneType: "sow", occurredAt: "2026-05-01" });
    const b = await uc.recordMilestone({ cultureId: culture.id, milestoneType: "sow", occurredAt: "2026-05-01" });
    expect(a.kind).toBe("created");
    expect(b.kind).toBe("deduped");
  });

  it("excludes soft-deleted plants from recap rows", async () => {
    const plants = mapRepo<Plant>();
    const events = mapRepo<PlantCareEvent>();
    const plant = await createPlantUseCases({ plants, meta: memoryMeta(), idGenerator: idGen, now }).createPlant({
      title: "Alive",
    });
    await events.upsert({
      id: idGen.newId(),
      plantId: plant.id,
      eventType: "water",
      occurredAt: "2026-10-15",
      notes: null,
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    });
    await plants.upsert({ ...plant, deletedAt: new Date(now()).toISOString() });
    const recap = createPlantsRecapRepository({
      plants: { ...plants, list: (includeDeleted) => Promise.resolve([...plants.store.values()]) },
      careEvents: {
        ...events,
        listByPlant: async () => [],
        listAll: () => Promise.resolve([...events.store.values()]),
        listInRange: async () => [...events.store.values()],
      },
      cultures: mapRepo<VegetableCulture>(),
      milestones: {
        ...mapRepo<VegetableMilestone>(),
        listByCulture: async () => [],
        listAll: async () => [],
        listInRange: async () => [],
      },
    });
    const rows = await recap.listCareEventsInRange("2026-10-01", "2026-10-31");
    expect(rows).toHaveLength(0);
  });

  it("sync apply collects outbox payloads", async () => {
    const plants = mapRepo<Plant>();
    const plant = await createPlantUseCases({ plants, meta: memoryMeta(), idGenerator: idGen, now }).createPlant({
      title: "Sync",
    });
    const careEvents = mapRepo<PlantCareEvent>();
    const careProfiles = mapRepo<PlantCareProfile>();
    const cultures = mapRepo<VegetableCulture>();
    const milestones = mapRepo<VegetableMilestone>();
    const apply = createPlantsGardenSyncApply({
      plants,
      careEvents: { ...careEvents, listByPlant: async () => [], listAll: async () => [], listInRange: async () => [] },
      careProfiles,
      cultures,
      milestones: {
        ...milestones,
        listByCulture: async () => [],
        listAll: async () => [],
        listInRange: async () => [],
      },
    });
    const payload = await apply.collectPushPayload();
    expect(payload.plants.some((p) => p.id === plant.id)).toBe(true);
  });

  it("care profile copies hints with new ids", async () => {
    const profiles = mapRepo<PlantCareProfile>();
    const uc = createCareProfileUseCases({ careProfiles: profiles, meta: memoryMeta(), idGenerator: idGen, now });
    const profile = await uc.createCareProfile({
      title: "Tropical",
      seasonalHints: [
        {
          id: "11111111-2222-4333-8444-555555555555",
          seasonKey: "summer",
          monthRangeText: null,
          actionText: "Arroser le matin",
          sortOrder: 0,
        },
      ],
    });
    const copied = uc.copyHintsToPlantHints(profile, idGen);
    expect(copied).toHaveLength(1);
    expect(copied[0]?.id).not.toBe(profile.seasonalHints[0]?.id);
  });
});
