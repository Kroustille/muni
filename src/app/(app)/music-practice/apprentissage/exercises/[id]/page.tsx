"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getPracticeExerciseUseCases } from "@/composition/client";
import type { PracticeExercise } from "@/domain/practice-exercise";
import { t } from "@/i18n";

export default function ExerciseDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [exercise, setExercise] = useState<PracticeExercise | undefined>();

  useEffect(() => {
    void getPracticeExerciseUseCases().then(async (uc) => {
      setExercise(await uc.getExercise(id));
    });
  }, [id]);

  if (exercise === undefined) return <p className="text-sm text-muted">…</p>;

  return (
    <div data-testid="exercise-detail">
      <Link href="/music-practice/apprentissage#exercises" className="text-sm text-accent">
        ← {t("musicPractice.apprentissage.exercises")}
      </Link>
      <h1 className="text-xl font-semibold">{exercise.title}</h1>
      {exercise.deletedAt !== null && (
        <button
          type="button"
          onClick={async () => {
            const uc = await getPracticeExerciseUseCases();
            setExercise(await uc.restoreExercise(id));
          }}
          data-testid="exercise-restore"
        >
          {t("musicPractice.restore")}
        </button>
      )}
    </div>
  );
}
