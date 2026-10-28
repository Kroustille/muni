"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFitnessWorkoutUseCases } from "@/composition/client";
import { progressionSeriesForExercise } from "@/domain/fitness/progression";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import {
  exerciseNameFromCatalog,
  useExerciseCatalogMap,
} from "@/components/fitness/use-exercise-catalog";
import { t } from "@/i18n";

export default function FitnessProgressionPage() {
  const params = useParams<{ exerciseId: string }>();
  const catalogById = useExerciseCatalogMap();
  const [series, setSeries] = useState<ReturnType<typeof progressionSeriesForExercise>>([]);

  useEffect(() => {
    void getFitnessWorkoutUseCases().then(async (uc) => {
      const logs: FitnessWorkoutLog[] = await uc.listWorkouts();
      setSeries(progressionSeriesForExercise(logs, params.exerciseId));
    });
  }, [params.exerciseId]);

  const title = exerciseNameFromCatalog(catalogById, params.exerciseId);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="fitness-progression">
      <h1 className="font-serif text-2xl font-semibold">{t("fitness.progression.title")}</h1>
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-2">
        {series.map((point) => (
          <li key={point.workoutId} className="rounded-xl border border-border p-3 text-sm">
            {point.calendarDate} — {point.bestChargeKg ?? "—"} kg
          </li>
        ))}
      </ul>
    </div>
  );
}
