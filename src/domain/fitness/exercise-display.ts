import type { ExerciseCatalogEntry } from "@/domain/fitness/catalog";

/** French label for UI; prefers catalog `nameFr`, then workout snapshot, then slug as last resort. */
export function resolveExerciseDisplayName(
  exerciseId: string,
  catalogEntry: ExerciseCatalogEntry | undefined,
  nameFrSnapshot?: string,
): string {
  if (catalogEntry !== undefined) return catalogEntry.nameFr;
  if (nameFrSnapshot !== undefined && nameFrSnapshot.trim().length > 0) return nameFrSnapshot;
  return exerciseId.replace(/-/g, " ");
}
