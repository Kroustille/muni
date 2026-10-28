import { describe, expect, it } from "vitest";

import { plantsRecapContributor } from "@/application/recap/contributors/plants-contributor";
import type { PlantsRecapRepository } from "@/application/ports/plants-recap-repository";
import { createRecapTestDeps } from "./recap-fixtures";

const plants: PlantsRecapRepository = {
  async listCareEventsInRange(from, to) {
    if (from > "2026-08-01" || to < "2026-08-05") return [];
    return [
      {
        id: "e1",
        plantId: "p1",
        occurredAt: "2026-08-05",
        title: "Monstera",
        subtitleKey: "plants.care.water",
        parentDeleted: false,
      },
    ];
  },
  async listMilestonesInRange(from, to) {
    if (from > "2026-08-01" || to < "2026-08-06") return [];
    return [
      {
        id: "m1",
        cultureId: "c1",
        occurredAt: "2026-08-06",
        title: "Tomates",
        subtitleKey: "plants.milestone.harvest",
        parentDeleted: false,
      },
    ];
  },
};

describe("plantsRecapContributor", () => {
  it("emits care events and milestones", async () => {
    const deps = createRecapTestDeps({ plants });
    const rows = await plantsRecapContributor.collectAchievements(deps, {
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(2);
  });

  it("skips rows when parent deleted", async () => {
    const deps = createRecapTestDeps({
      plants: {
        async listCareEventsInRange() {
          return [
            {
              id: "e1",
              plantId: "p1",
              occurredAt: "2026-08-05",
              title: "Monstera",
              subtitleKey: "plants.care.water",
              parentDeleted: true,
            },
          ];
        },
        async listMilestonesInRange() {
          return [];
        },
      },
    });
    const rows = await plantsRecapContributor.collectAchievements(deps, {
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(0);
  });
});
