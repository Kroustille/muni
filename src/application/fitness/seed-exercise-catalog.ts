import type { ExerciseCatalogDocument, MusclesCatalogDocument } from "@/domain/fitness/catalog";
import { exerciseCatalogDocumentSchema, musclesCatalogDocumentSchema } from "@/domain/fitness/catalog";
import type { FitnessExerciseCatalogStore } from "@/application/ports/fitness-settings-repository";

export type SeedExerciseCatalogDeps = {
  catalog: FitnessExerciseCatalogStore;
  loadExercises: () => Promise<ExerciseCatalogDocument>;
  loadMuscles?: () => Promise<MusclesCatalogDocument>;
};

export async function seedExerciseCatalogIfNeeded(deps: SeedExerciseCatalogDeps): Promise<void> {
  const doc = exerciseCatalogDocumentSchema.parse(await deps.loadExercises());
  void deps.loadMuscles;
  const currentVersion = await deps.catalog.getVersion();
  if (currentVersion !== undefined && currentVersion >= doc.version) return;
  await deps.catalog.upsertMany(
    doc.exercises.map((entry) => ({ ...entry, catalogVersion: doc.version })),
  );
  await deps.catalog.setVersion(doc.version);
}

export async function fetchBundledExerciseCatalog(): Promise<ExerciseCatalogDocument> {
  const response = await fetch("/fitness/exercises.catalog.json");
  if (!response.ok) throw new Error("failed to load exercise catalog");
  return exerciseCatalogDocumentSchema.parse(await response.json());
}

export async function fetchBundledMusclesCatalog(): Promise<MusclesCatalogDocument> {
  const response = await fetch("/fitness/muscles.catalog.json");
  if (!response.ok) throw new Error("failed to load muscles catalog");
  return musclesCatalogDocumentSchema.parse(await response.json());
}
