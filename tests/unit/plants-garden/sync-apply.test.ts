import { describe, expect, it } from "vitest";

import { createPlantsGardenSyncApply } from "@/application/plants-garden/sync-apply";
import { plantToWire } from "@/domain/plant";
import { plantCareEventToWire } from "@/domain/plant-care-event";
import type { Plant } from "@/domain/plant";
import type { PlantCareEvent } from "@/domain/plant-care-event";
import type { PlantCareProfile } from "@/domain/plant-care-profile";
import type { VegetableCulture } from "@/domain/vegetable-culture";
import type { VegetableMilestone } from "@/domain/vegetable-milestone";

function baseMapRepo<T extends { id: string }>() {
  const store = new Map<string, T>();
  const outbox = new Set<string>();
  return {
    store,
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()]),
    upsert: async (row: T, options?: { enqueue?: boolean }) => {
      store.set(row.id, row);
      if (options?.enqueue !== false) outbox.add(row.id);
      return row;
    },
    subscribe: () => () => undefined,
    outbox: () => Promise.resolve([...outbox]),
    clearOutbox: async (ids: string[]) => {
      for (const id of ids) outbox.delete(id);
    },
  };
}

function careEventRepo() {
  const base = baseMapRepo<PlantCareEvent>();
  return {
    ...base,
    listByPlant: async () => [] as PlantCareEvent[],
    listAll: async () => [...base.store.values()],
    listInRange: async () => [...base.store.values()],
  };
}

function milestoneRepo() {
  const base = baseMapRepo<VegetableMilestone>();
  return {
    ...base,
    listByCulture: async () => [] as VegetableMilestone[],
    listAll: async () => [...base.store.values()],
    listInRange: async () => [...base.store.values()],
  };
}

describe("plants-garden sync apply", () => {
  it("applies remote rows without enqueue and clears outboxes", async () => {
    const plants = baseMapRepo<Plant>();
    const careEvents = careEventRepo();
    const careProfiles = baseMapRepo<PlantCareProfile>();
    const cultures = baseMapRepo<VegetableCulture>();
    const milestones = milestoneRepo();

    const plant = {
      id: "11111111-2222-4333-8444-555555555555",
      title: "A",
      locationTag: "indoor" as const,
      notes: null,
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "t" },
    };
    await plants.upsert(plant);

    const apply = createPlantsGardenSyncApply({
      plants,
      careEvents,
      careProfiles,
      cultures,
      milestones,
    });

    const remotePlant = plantToWire({
      ...plant,
      title: "Remote",
    });
    const eventWire = plantCareEventToWire({
      id: "22222222-3333-4333-8444-555555555555",
      plantId: plant.id,
      eventType: "fertilize",
      occurredAt: "2026-10-01",
      notes: null,
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "t" },
    });
    await apply.applyRemote({
      plants: [remotePlant],
      careEvents: [eventWire],
      careProfiles: [
        {
          id: "33333333-4444-4333-8444-555555555555",
          title: "P",
          seasonal_hints: [],
          deleted_at: null,
          fields_updated_at: { title: "t" },
        },
      ],
      cultures: [
        {
          id: "44444444-5555-4333-8444-555555555555",
          title: "C",
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
    expect((await plants.get(plant.id))?.title).toBe("Remote");

    await careEvents.upsert({
      id: eventWire.id,
      plantId: plant.id,
      eventType: "fertilize",
      occurredAt: "2026-10-01",
      notes: null,
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "t" },
    });

    const payload = await apply.collectPushPayload();
    expect(payload.plants).toHaveLength(1);
    expect(payload.careEvents).toHaveLength(1);

    await apply.clearOutboxes({
      plantIds: payload.plants.map((p) => p.id),
      careEventIds: payload.careEvents.map((e) => e.id),
      careProfileIds: [],
      cultureIds: [],
      milestoneIds: [],
    });
    expect(await plants.outbox()).toEqual([]);
    expect(await careEvents.outbox()).toEqual([]);
  });
});
