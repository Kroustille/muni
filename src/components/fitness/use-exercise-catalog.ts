"use client";

import { useEffect, useState } from "react";
import type { ExerciseCatalogEntry } from "@/domain/fitness/catalog";

export function useExerciseCatalogMap(): Map<string, ExerciseCatalogEntry> {
  const [catalogById, setCatalogById] = useState<Map<string, ExerciseCatalogEntry>>(
    () => new Map(),
  );

  useEffect(() => {
    void fetch("/fitness/exercises.catalog.json")
      .then((r) => r.json())
      .then((doc) => {
        const map = new Map<string, ExerciseCatalogEntry>();
        for (const entry of doc.exercises ?? []) {
          map.set(entry.id, entry);
        }
        setCatalogById(map);
      });
  }, []);

  return catalogById;
}

export function exerciseNameFromCatalog(
  catalogById: Map<string, ExerciseCatalogEntry>,
  exerciseId: string,
  fallback?: string,
): string {
  return catalogById.get(exerciseId)?.nameFr ?? fallback ?? exerciseId;
}
