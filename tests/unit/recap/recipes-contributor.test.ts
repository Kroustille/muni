import { describe, expect, it } from "vitest";

import { recipesRecapContributor } from "@/application/recap/contributors/recipes-contributor";
import { makeItem } from "../../helpers/item-repository.contract";
import { createRecapTestDeps } from "./recap-fixtures";

describe("recipesRecapContributor", () => {
  it("emits one line per cooked date in range", async () => {
    const deps = createRecapTestDeps();
    const recipe = makeItem({
      type: "recipe",
      status: null,
      cookedDates: ["2026-01-10", "2026-01-12"],
    });
    await deps.items.put(recipe, { enqueue: false });
    const rows = await recipesRecapContributor.collectAchievements(deps, {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(2);
  });
});
