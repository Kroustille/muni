import { describe, expect, it } from "vitest";

import { ratingBadgeClass, ratingTierClass } from "@/components/rating-colors";

describe("rating colors", () => {
  it("maps each tier to a distinct class", () => {
    expect(ratingTierClass(1)).toContain("red");
    expect(ratingTierClass(5)).toContain("emerald");
    expect(ratingBadgeClass(3)).toContain("amber");
  });
});
