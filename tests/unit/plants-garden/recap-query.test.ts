import { describe, expect, it } from "vitest";

import { createPlantsRecapRepository } from "@/application/plants-garden/plants-recap-query";
import type { PlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { PlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import type { PlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";
import type { PlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import { buildCareEvent, buildPlant } from "./fixtures";

function memoryRepos() {
  let plants = [buildPlant()];
  let events = [buildCareEvent({ occurredAt: "2026-10-15" })];

  const plantRepo: PlantsGardenPlantRepository = {
    get: async (id) => plants.find((p) => p.id === id),
    list: async (includeDeleted) =>
      includeDeleted ? plants : plants.filter((p) => p.deletedAt === null),
    upsert: async (plant) => {
      plants = plants.filter((p) => p.id !== plant.id).concat(plant);
      return plant;
    },
    subscribe: () => () => undefined,
    outbox: async () => [],
    clearOutbox: async () => undefined,
  };

  const careRepo: PlantsGardenCareEventRepository = {
    get: async (id) => events.find((e) => e.id === id),
    listByPlant: async (plantId) => events.filter((e) => e.plantId === plantId),
    listAll: async () => events,
    listInRange: async (from, to) =>
      events.filter((e) => e.occurredAt >= from && e.occurredAt <= to && e.deletedAt === null),
    upsert: async (event) => {
      events = events.filter((e) => e.id !== event.id).concat(event);
      return event;
    },
    subscribe: () => () => undefined,
    outbox: async () => [],
    clearOutbox: async () => undefined,
  };

  const cultureRepo: PlantsGardenCultureRepository = {
    get: async () => undefined,
    list: async () => [],
    upsert: async (c) => c,
    subscribe: () => () => undefined,
    outbox: async () => [],
    clearOutbox: async () => undefined,
  };

  const milestoneRepo: PlantsGardenMilestoneRepository = {
    get: async () => undefined,
    listByCulture: async () => [],
    listAll: async () => [],
    listInRange: async () => [],
    upsert: async (m) => m,
    subscribe: () => () => undefined,
    outbox: async () => [],
    clearOutbox: async () => undefined,
  };

  return {
    plantRepo,
    careRepo,
    cultureRepo,
    milestoneRepo,
    setDeletedPlant: () => {
      plants = [buildPlant({ deletedAt: "2026-10-01T12:00:00.000Z" })];
    },
  };
}

describe("plants recap query", () => {
  it("excludes soft-deleted plants from care recap lines", async () => {
    const repos = memoryRepos();
    const repo = createPlantsRecapRepository({
      plants: repos.plantRepo,
      careEvents: repos.careRepo,
      cultures: repos.cultureRepo,
      milestones: repos.milestoneRepo,
    });

    const active = await repo.listCareEventsInRange("2026-10-01", "2026-10-31");
    expect(active).toHaveLength(1);

    repos.setDeletedPlant();
    const afterDelete = await repo.listCareEventsInRange("2026-10-01", "2026-10-31");
    expect(afterDelete).toHaveLength(0);
  });
});
