import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresPlantsGardenPlantRepository } from "@/adapters/postgres/plants-garden-plant-repository";
import { createPostgresPlantsGardenCareEventRepository } from "@/adapters/postgres/plants-garden-care-event-repository";
import { createPostgresPlantsGardenCareProfileRepository } from "@/adapters/postgres/plants-garden-care-profile-repository";
import { createPostgresPlantsGardenCultureRepository } from "@/adapters/postgres/plants-garden-culture-repository";
import { createPostgresPlantsGardenMilestoneRepository } from "@/adapters/postgres/plants-garden-milestone-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { createPlantsGardenSyncService } from "@/application/server/plants-garden-sync-service";
import { plantToWire } from "@/domain/plant";
import { plantCareEventToWire } from "@/domain/plant-care-event";
import { vegetableCultureToWire } from "@/domain/vegetable-culture";
import { vegetableMilestoneToWire } from "@/domain/vegetable-milestone";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");

let testDb: TestDatabase | undefined;
let userId: string;
let userB: string;

describe("plants-garden sync", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userId = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000099",
        email: "plants-sync@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    userB = (
      await users.create({
        id: "10000000-0000-4000-8000-000000000098",
        email: "plants-sync-b@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  it("pushes and pulls plant and care event", async () => {
    if (testDb === undefined) return;
    const sync = createPlantsGardenSyncService({
      plants: createPostgresPlantsGardenPlantRepository(testDb.db),
      careEvents: createPostgresPlantsGardenCareEventRepository(testDb.db),
      careProfiles: createPostgresPlantsGardenCareProfileRepository(testDb.db),
      cultures: createPostgresPlantsGardenCultureRepository(testDb.db),
      milestones: createPostgresPlantsGardenMilestoneRepository(testDb.db),
      now: () => NOW,
    });

    const plantWire = plantToWire({
      id: "11111111-2222-4333-8444-555555555555",
      title: "Monstera",
      locationTag: "indoor",
      notes: null,
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    const eventWire = plantCareEventToWire({
      id: "22222222-3333-4333-8444-555555555555",
      plantId: plantWire.id,
      eventType: "water",
      occurredAt: "2026-10-20",
      notes: null,
      seasonalHintId: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userId, {
      plants: [plantWire],
      careEvents: [eventWire],
      careProfiles: [],
      cultures: [],
      milestones: [],
    });

    const pulled = await sync.pull(userId, null, 100);
    expect(pulled.plants.some((p) => p.id === plantWire.id)).toBe(true);
    expect(pulled.careEvents.some((e) => e.id === eventWire.id)).toBe(true);
  });

  it("isolates rows per user", async () => {
    if (testDb === undefined) return;
    const sync = createPlantsGardenSyncService({
      plants: createPostgresPlantsGardenPlantRepository(testDb.db),
      careEvents: createPostgresPlantsGardenCareEventRepository(testDb.db),
      careProfiles: createPostgresPlantsGardenCareProfileRepository(testDb.db),
      cultures: createPostgresPlantsGardenCultureRepository(testDb.db),
      milestones: createPostgresPlantsGardenMilestoneRepository(testDb.db),
      now: () => NOW,
    });

    const plantWire = plantToWire({
      id: "33333333-4444-4333-8444-555555555555",
      title: "User B plant",
      locationTag: "outdoor",
      notes: null,
      careProfileId: null,
      seasonalHints: [],
      deletedAt: null,
      fieldsUpdatedAt: { title: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userB, {
      plants: [plantWire],
      careEvents: [],
      careProfiles: [],
      cultures: [],
      milestones: [],
    });

    const pullA = await sync.pull(userId, null, 100);
    expect(pullA.plants.some((p) => p.id === plantWire.id)).toBe(false);
  });

  it("pushes and pulls P2 culture and milestone arrays", async () => {
    if (testDb === undefined) return;
    const sync = createPlantsGardenSyncService({
      plants: createPostgresPlantsGardenPlantRepository(testDb.db),
      careEvents: createPostgresPlantsGardenCareEventRepository(testDb.db),
      careProfiles: createPostgresPlantsGardenCareProfileRepository(testDb.db),
      cultures: createPostgresPlantsGardenCultureRepository(testDb.db),
      milestones: createPostgresPlantsGardenMilestoneRepository(testDb.db),
      now: () => NOW,
    });

    const cultureWire = vegetableCultureToWire({
      id: "44444444-5555-4333-8444-555555555555",
      title: "Tomates",
      locationNote: "Bac sud",
      variety: null,
      notes: null,
      plantId: null,
      deletedAt: null,
      fieldsUpdatedAt: { title: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    const milestoneWire = vegetableMilestoneToWire({
      id: "55555555-6666-4333-8444-555555555555",
      cultureId: cultureWire.id,
      milestoneType: "sow",
      occurredAt: "2026-05-01",
      notes: null,
      deletedAt: null,
      fieldsUpdatedAt: { occurredAt: "2026-01-01T12:00:00.000Z-0-dev" },
    });

    await sync.push(userId, {
      plants: [],
      careEvents: [],
      careProfiles: [],
      cultures: [cultureWire],
      milestones: [milestoneWire],
    });

    const pulled = await sync.pull(userId, null, 100);
    expect(pulled.cultures.some((c) => c.id === cultureWire.id)).toBe(true);
    expect(pulled.milestones.some((m) => m.id === milestoneWire.id)).toBe(true);
  });
});
