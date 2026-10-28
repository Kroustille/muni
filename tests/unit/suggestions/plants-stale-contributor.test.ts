import { describe, expect, it } from "vitest";

import { plantsStaleContributor } from "@/application/suggestions/contributors/plants-stale-contributor";
import type {
  PlantCareEventRow,
  PlantSuggestionRow,
  VegetableCultureRow,
} from "@/application/suggestions/build-daily-suggestions";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

describe("plantsStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("returns empty when plants ports are absent", async () => {
    const candidates = await plantsStaleContributor.listStaleCandidates({} as never, ctx);
    expect(candidates).toEqual([]);
  });

  it("emits water_plant and potager_milestone candidates", async () => {
    const plants: PlantSuggestionRow[] = [
      {
        id: "11111111-1111-4111-8111-111111111101",
        name: "Monstera",
        deletedAt: null,
        createdAt: dateOnlyDaysAgo(30) + "T10:00:00.000Z",
      },
    ];
    const events: PlantCareEventRow[] = [
      {
        id: "22222222-2222-4222-8222-222222222202",
        plantId: plants[0]!.id,
        eventType: "water",
        occurredAt: dateOnlyDaysAgo(10) + "T10:00:00.000Z",
        deletedAt: null,
      },
    ];
    const cultures: VegetableCultureRow[] = [
      {
        id: "33333333-3333-4333-8333-333333333303",
        name: "Tomates",
        deletedAt: null,
        createdAt: dateOnlyDaysAgo(40) + "T10:00:00.000Z",
        lastMilestoneAt: dateOnlyDaysAgo(20) + "T10:00:00.000Z",
      },
    ];

    const deps = {
      plants: {
        listPlants: async () => plants,
        listCareEvents: async () => events,
        listVegetableCultures: async () => cultures,
      },
    };

    const candidates = await plantsStaleContributor.listStaleCandidates(deps as never, ctx);
    expect(candidates.some((c) => c.kind === "water_plant")).toBe(true);
    expect(candidates.some((c) => c.kind === "potager_milestone")).toBe(true);
    expect(candidates.find((c) => c.kind === "water_plant")?.deepLink).toBe(
      `/plants/${plants[0]!.id}`,
    );
  });
});
