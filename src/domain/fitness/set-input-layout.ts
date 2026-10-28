import type { ExerciseCatalogEntry } from "@/domain/fitness/catalog";

const LOAD_BEARING_EQUIPMENT = new Set(["barre", "haltères", "machine", "câble", "kettlebell"]);

export type SetField = "reps" | "charge" | "duration" | "rpe" | "distanceNote";

export type SetInputLayout = {
  visibleFields: SetField[];
  collapsedFields: SetField[];
};

export function isLoadBearingStrength(entry: ExerciseCatalogEntry): boolean {
  if (entry.modality !== "strength") return false;
  return entry.equipment.some((e) => LOAD_BEARING_EQUIPMENT.has(e));
}

export function resolveSetInputLayout(entry: ExerciseCatalogEntry | undefined): SetInputLayout {
  if (entry === undefined) {
    return {
      visibleFields: ["reps", "charge", "duration", "rpe"],
      collapsedFields: [],
    };
  }

  if (entry.modality === "cardio" || entry.modality === "mobility") {
    return {
      visibleFields: ["duration", "rpe"],
      collapsedFields: ["reps", "charge", "distanceNote"],
    };
  }

  if (isLoadBearingStrength(entry)) {
    return {
      visibleFields: ["reps", "charge", "duration", "rpe"],
      collapsedFields: [],
    };
  }

  return {
    visibleFields: ["reps", "rpe", "duration"],
    collapsedFields: ["charge"],
  };
}
