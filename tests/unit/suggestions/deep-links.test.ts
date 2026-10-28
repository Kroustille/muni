import { describe, expect, it } from "vitest";

import {
  buildItemDeepLink,
  buildFitnessSkipDeepLink,
} from "@/application/suggestions/deep-links";
import { SUGGESTION_DOMAIN_IDS } from "@/domain/activity-suggestion";

describe("suggestion deep links", () => {
  const itemId = "11111111-1111-4111-8111-111111111101";

  it("maps item-backed domains to /items/{id}", () => {
    for (const domainId of ["book", "movie", "music_track", "recipe"] as const) {
      expect(buildItemDeepLink(domainId, itemId)).toBe(`/items/${itemId}`);
    }
  });

  it("maps fitness to the fitness hub", () => {
    expect(buildItemDeepLink("fitness", itemId)).toBe("/fitness");
  });

  it("maps music_practice to the tracks route", () => {
    expect(buildItemDeepLink("music_practice", itemId)).toBe("/music/tracks");
  });

  it("maps plants to plant detail", () => {
    expect(buildItemDeepLink("plants", itemId)).toBe(`/plants/${itemId}`);
  });

  it("covers every suggestion domain id", () => {
    for (const domainId of SUGGESTION_DOMAIN_IDS) {
      expect(buildItemDeepLink(domainId, itemId)).toMatch(/^\//u);
    }
  });

  it("builds fitness skip deep link to workout route", () => {
    expect(buildFitnessSkipDeepLink("prog-id")).toBe("/fitness/workout/prog-id");
  });
});
