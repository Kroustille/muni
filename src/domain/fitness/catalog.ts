import { z } from "zod";

import { normalizeText } from "@/domain/text";

export const exerciseModalitySchema = z.enum(["strength", "cardio", "mobility"]);

export const exerciseCatalogEntrySchema = z.strictObject({
  id: z.string().min(1),
  nameFr: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.string().min(1),
  equipment: z.array(z.string()),
  modality: exerciseModalitySchema,
  tags: z.array(z.string()).optional(),
});

export type ExerciseCatalogEntry = z.infer<typeof exerciseCatalogEntrySchema>;

export const exerciseCatalogDocumentSchema = z.strictObject({
  version: z.number().int().positive(),
  locale: z.literal("fr"),
  exercises: z.array(exerciseCatalogEntrySchema),
});

export type ExerciseCatalogDocument = z.infer<typeof exerciseCatalogDocumentSchema>;

export const muscleCategorySchema = z.strictObject({
  id: z.string().min(1),
  nameFr: z.string().min(1),
  sortOrder: z.number().int(),
});

export const musclesCatalogDocumentSchema = z.strictObject({
  version: z.number().int().positive(),
  muscles: z.array(muscleCategorySchema),
});

export type MusclesCatalogDocument = z.infer<typeof musclesCatalogDocumentSchema>;

export type StoredCatalogExercise = ExerciseCatalogEntry & { catalogVersion: number };

export function searchCatalogExercises(
  exercises: ExerciseCatalogEntry[],
  query: string,
): ExerciseCatalogEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return exercises;
  const normalized = normalizeText(trimmed);
  return exercises.filter(
    (entry) =>
      normalizeText(entry.nameFr).includes(normalized) ||
      normalizeText(entry.nameEn).includes(normalized),
  );
}

export function filterCatalogByMuscle(
  exercises: ExerciseCatalogEntry[],
  muscleId: string | null,
): ExerciseCatalogEntry[] {
  if (muscleId === null || muscleId === "") return exercises;
  return exercises.filter((entry) => entry.category === muscleId);
}
