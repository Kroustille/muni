import { describe, expect, it } from "vitest";

import { heatmapSegmentStyles } from "@/components/recap/recap-domain-accents";

describe("heatmap segments", () => {
  it("uses one full segment for single domain", () => {
    const segments = heatmapSegmentStyles(["book"]);
    expect(segments).toHaveLength(1);
    expect(segments[0].color).toBe("#9f1239");
  });

  it("splits two domains equally", () => {
    const segments = heatmapSegmentStyles(["book", "movie"]);
    expect(segments).toHaveLength(2);
    expect(segments[0].flex + segments[1].flex).toBeCloseTo(1);
  });

  it("supports six domains", () => {
    const segments = heatmapSegmentStyles([
      "book",
      "movie",
      "music_track",
      "recipe",
      "fitness",
      "plants",
    ]);
    expect(segments).toHaveLength(6);
  });
});
