import { describe, expect, it } from "vitest";

import { plantSchema, validatePlantTitle } from "@/domain/plant";
import { buildPlant } from "./fixtures";

describe("plant domain", () => {
  it("accepts title trimmed length 1-500", () => {
    expect(validatePlantTitle("  Monstera  ")).toBeNull();
    expect(validatePlantTitle("")).toBe("title length 1-500");
    expect(validatePlantTitle("x".repeat(501))).toBe("title length 1-500");
  });

  it("accepts location tags indoor outdoor both", () => {
    for (const locationTag of ["indoor", "outdoor", "both"] as const) {
      const plant = plantSchema.parse(buildPlant({ locationTag }));
      expect(plant.locationTag).toBe(locationTag);
    }
  });
});
