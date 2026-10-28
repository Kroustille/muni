import { describe, expect, it } from "vitest";
import { resolveExerciseDisplayName } from "@/domain/fitness/exercise-display";
import type { ExerciseCatalogEntry } from "@/domain/fitness/catalog";

const entry: ExerciseCatalogEntry = {
  id: "souleve-de-terre",
  nameFr: "Soulevé de terre",
  nameEn: "Deadlift",
  category: "dos",
  equipment: ["barre"],
  modality: "strength",
};

describe("resolveExerciseDisplayName", () => {
  it("prefers catalog nameFr", () => {
    expect(resolveExerciseDisplayName("souleve-de-terre", entry)).toBe("Soulevé de terre");
  });

  it("falls back to snapshot when catalog missing", () => {
    expect(resolveExerciseDisplayName("souleve-de-terre", undefined, "Soulevé de terre")).toBe(
      "Soulevé de terre",
    );
  });

  it("humanizes id as last resort", () => {
    expect(resolveExerciseDisplayName("souleve-de-terre", undefined)).toBe("souleve de terre");
  });
});
