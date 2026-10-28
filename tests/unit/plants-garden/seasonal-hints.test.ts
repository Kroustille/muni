import { describe, expect, it } from "vitest";

import { validateSeasonalHint, type PlantSeasonalHint } from "@/domain/plant";

describe("seasonal hints", () => {
  it("validates actionText 1-500 and monthRangeText max 100", () => {
    const hint: PlantSeasonalHint = {
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      seasonKey: "spring",
      monthRangeText: "Mars–avril",
      actionText: "Rempotage possible",
      sortOrder: 0,
    };
    expect(validateSeasonalHint(hint)).toBeNull();
    expect(
      validateSeasonalHint({ ...hint, actionText: "", monthRangeText: null, seasonKey: null }),
    ).not.toBeNull();
    expect(validateSeasonalHint({ ...hint, actionText: "x".repeat(501) })).not.toBeNull();
    expect(validateSeasonalHint({ ...hint, monthRangeText: "x".repeat(101) })).not.toBeNull();
  });
});
