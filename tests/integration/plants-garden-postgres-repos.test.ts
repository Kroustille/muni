import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresPlantsGardenCareEventRepository } from "@/adapters/postgres/plants-garden-care-event-repository";
import { createPostgresPlantsGardenCareProfileRepository } from "@/adapters/postgres/plants-garden-care-profile-repository";
import { createPostgresPlantsGardenCultureRepository } from "@/adapters/postgres/plants-garden-culture-repository";
import { createPostgresPlantsGardenMilestoneRepository } from "@/adapters/postgres/plants-garden-milestone-repository";
import { createPostgresPlantsGardenPlantRepository } from "@/adapters/postgres/plants-garden-plant-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { plantCareEventToWire } from "@/domain/plant-care-event";
import { plantCareProfileToWire, wireToPlantCareProfile } from "@/domain/plant-care-profile";
import { wireToVegetableCulture } from "@/domain/vegetable-culture";
import { wireToVegetableMilestone } from "@/domain/vegetable-milestone";
import { plantToWire } from "@/domain/plant";
import { vegetableCultureToWire } from "@/domain/vegetable-culture";
import { vegetableMilestoneToWire } from "@/domain/vegetable-milestone";
import { wireToPlant } from "@/domain/plant";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");

let testDb: TestDatabase | undefined;
let userId: string;

describe("postgres plants-garden repositories", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userId = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000088",
        email: "plants-pg@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("round-trips all entity types", async () => {
    if (testDb === undefined) return;
    const plants = createPostgresPlantsGardenPlantRepository(testDb.db);
    const careEvents = createPostgresPlantsGardenCareEventRepository(testDb.db);
    const profiles = createPostgresPlantsGardenCareProfileRepository(testDb.db);
    const cultures = createPostgresPlantsGardenCultureRepository(testDb.db);
    const milestones = createPostgresPlantsGardenMilestoneRepository(testDb.db);

    const plantWire = plantToWire({
      id: "11111111-2222-4333-8444-555555555555",
      title: "Fougère",
      locationTag: "indoor",
      notes: "Test",
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "t" },
    });

    await plants.transaction(async (repo) => {
      await repo.upsert(userId, wireToPlant(plantWire));
    });

    const eventWire = plantCareEventToWire({
      id: "22222222-3333-4333-8444-555555555555",
      plantId: plantWire.id,
      eventType: "mist",
      occurredAt: "2026-09-01",
      notes: null,
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "t" },
    });

    await careEvents.transaction(async (repo) => {
      await repo.upsert(userId, {
        id: eventWire.id,
        plantId: plantWire.id,
        eventType: "mist",
        occurredAt: "2026-09-01",
        notes: null,
        seasonalHintId: null,
        deletedAt: null,
        fieldsUpdatedAt: { occurredAt: "t" },
      });
      const dup = await repo.findWaterOnDay(userId, plantWire.id, "2026-09-01");
      expect(dup).toBeUndefined();
    });

    const profileWire = plantCareProfileToWire({
      id: "33333333-4444-4333-8444-555555555555",
      title: "Profile",
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "t" },
    });
    await profiles.transaction(async (repo) => repo.upsert(userId, wireToPlantCareProfile(profileWire)));

    const cultureWire = vegetableCultureToWire({
      id: "44444444-5555-4333-8444-555555555555",
      title: "Carottes",
      locationNote: null,
      variety: null,
      notes: null,
      plantId: null,
      deletedAt: null,
      fieldsUpdatedAt: { title: "t" },
    });
    await cultures.transaction(async (repo) => repo.upsert(userId, wireToVegetableCulture(cultureWire)));

    const milestoneWire = vegetableMilestoneToWire({
      id: "55555555-6666-4333-8444-555555555555",
      cultureId: cultureWire.id,
      milestoneType: "harvest",
      occurredAt: "2026-10-01",
      notes: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "t" },
    });
    await milestones.transaction(async (repo) => repo.upsert(userId, wireToVegetableMilestone(milestoneWire)));

    const pulledPlants = await plants.pullSince(userId, null, 10);
    expect(pulledPlants.some((p) => p.id === plantWire.id)).toBe(true);
    const rangeEvents = await careEvents.listInRange(userId, "2026-09-01", "2026-09-30");
    expect(rangeEvents.length).toBeGreaterThan(0);
    const rangeMilestones = await milestones.listInRange(userId, "2026-10-01", "2026-10-31");
    expect(rangeMilestones.length).toBeGreaterThan(0);
  });
});
