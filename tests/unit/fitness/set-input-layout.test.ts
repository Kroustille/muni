import { describe, expect, it } from "vitest";
import { isLoadBearingStrength, resolveSetInputLayout } from "@/domain/fitness/set-input-layout";
import type { ExerciseCatalogEntry } from "@/domain/fitness/catalog";

const deadlift: ExerciseCatalogEntry = {
  id: "souleve-de-terre",
  nameFr: "Soulevé de terre",
  nameEn: "Deadlift",
  category: "dos",
  equipment: ["barre"],
  modality: "strength",
};

const pushUp: ExerciseCatalogEntry = {
  id: "pompes",
  nameFr: "Pompes",
  nameEn: "Push-up",
  category: "pectoraux",
  equipment: ["poids du corps"],
  modality: "strength",
};

const run: ExerciseCatalogEntry = {
  id: "course-footing",
  nameFr: "Course à pied",
  nameEn: "Running",
  category: "cardio",
  equipment: ["aucun"],
  modality: "cardio",
};

describe("set input layout", () => {
  it("detects load-bearing strength", () => {
    expect(isLoadBearingStrength(deadlift)).toBe(true);
    expect(isLoadBearingStrength(pushUp)).toBe(false);
  });

  it("prioritizes reps and charge for loaded strength", () => {
    const layout = resolveSetInputLayout(deadlift);
    expect(layout.visibleFields).toEqual(["reps", "charge", "duration", "rpe"]);
    expect(layout.collapsedFields).toEqual([]);
  });

  it("keeps charge optional for bodyweight strength", () => {
    const layout = resolveSetInputLayout(pushUp);
    expect(layout.visibleFields).toContain("reps");
    expect(layout.collapsedFields).toContain("charge");
  });

  it("is duration-first for cardio", () => {
    const layout = resolveSetInputLayout(run);
    expect(layout.visibleFields[0]).toBe("duration");
    expect(layout.collapsedFields).toEqual(["reps", "charge", "distanceNote"]);
  });
});
