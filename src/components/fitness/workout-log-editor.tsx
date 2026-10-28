"use client";

import { useEffect, useState } from "react";
import type { FitnessWorkoutLog, LoggedExercise } from "@/domain/fitness/workout-log";
import type { ExerciseCatalogEntry } from "@/domain/fitness/catalog";
import { resolveSetInputLayout, type SetField } from "@/domain/fitness/set-input-layout";
import { ExercisePicker } from "@/components/fitness/exercise-picker";
import { rememberExerciseId } from "@/application/fitness/recent-exercises";
import { t } from "@/i18n";

type WorkoutLogEditorProps = {
  workout: FitnessWorkoutLog;
  prExerciseIds: Set<string>;
  onUpdate: (loggedExercises: LoggedExercise[]) => void;
  onComplete: () => void;
  onAbandon: () => void;
  onRecovery?: (recovery: FitnessWorkoutLog["recovery"]) => void;
};

export function WorkoutLogEditor({
  workout,
  prExerciseIds,
  onUpdate,
  onComplete,
  onAbandon,
  onRecovery,
}: WorkoutLogEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [catalogById, setCatalogById] = useState<Map<string, ExerciseCatalogEntry>>(() => new Map());
  const [expandedSets, setExpandedSets] = useState<Set<string>>(() => new Set());

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

  const updateExercise = (index: number, exercise: LoggedExercise) => {
    const next = [...workout.loggedExercises];
    next[index] = exercise;
    onUpdate(next);
  };

  const addSet = (index: number) => {
    const exercise = workout.loggedExercises[index];
    updateExercise(index, { ...exercise, sets: [...exercise.sets, {}] });
  };

  const setKey = (exIndex: number, setIndex: number) => `${exIndex}-${setIndex}`;

  const toggleExpanded = (key: string) => {
    setExpandedSets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderField = (
    field: SetField,
    exercise: LoggedExercise,
    exIndex: number,
    setIndex: number,
  ) => {
    const set = exercise.sets[setIndex];
    if (set === undefined) return null;

    if (field === "reps") {
      return (
        <input
          key="reps"
          type="number"
          placeholder={t("fitness.workout.reps")}
          className="rounded border border-border px-2 py-1 text-sm"
          value={set.reps ?? ""}
          data-testid="fitness-set-reps"
          onChange={(e) => {
            const sets = [...exercise.sets];
            sets[setIndex] = { ...set, reps: e.target.value ? Number(e.target.value) : undefined };
            updateExercise(exIndex, { ...exercise, sets });
          }}
        />
      );
    }
    if (field === "charge") {
      return (
        <input
          key="charge"
          type="number"
          placeholder={t("fitness.workout.charge")}
          className="rounded border border-border px-2 py-1 text-sm"
          value={set.chargeKg ?? ""}
          data-testid="fitness-set-charge"
          onChange={(e) => {
            const sets = [...exercise.sets];
            sets[setIndex] = {
              ...set,
              chargeKg: e.target.value ? Number(e.target.value) : undefined,
            };
            updateExercise(exIndex, { ...exercise, sets });
          }}
        />
      );
    }
    if (field === "duration") {
      return (
        <input
          key="duration"
          type="number"
          placeholder={t("fitness.workout.duration")}
          className="rounded border border-border px-2 py-1 text-sm"
          value={set.durationSeconds ? set.durationSeconds / 60 : ""}
          data-testid="fitness-set-duration"
          onChange={(e) => {
            const sets = [...exercise.sets];
            const minutes = e.target.value ? Number(e.target.value) : undefined;
            sets[setIndex] = {
              ...set,
              durationSeconds: minutes !== undefined ? Math.round(minutes * 60) : undefined,
            };
            updateExercise(exIndex, { ...exercise, sets });
          }}
        />
      );
    }
    return (
      <input
        key="rpe"
        type="number"
        placeholder={t("fitness.workout.rpe")}
        className="rounded border border-border px-2 py-1 text-sm"
        value={set.rpe ?? ""}
        onChange={(e) => {
          const sets = [...exercise.sets];
          sets[setIndex] = { ...set, rpe: e.target.value ? Number(e.target.value) : undefined };
          updateExercise(exIndex, { ...exercise, sets });
        }}
        data-testid="fitness-set-rpe"
      />
    );
  };

  return (
    <div className="space-y-4" data-testid="fitness-workout-editor">
      <h1 className="font-serif text-xl font-semibold">{workout.title}</h1>
      {workout.loggedExercises.map((exercise, exIndex) => {
        const layout = resolveSetInputLayout(catalogById.get(exercise.exerciseId));
        return (
          <section
            key={`${exercise.exerciseId}-${exIndex}`}
            className="rounded-xl border border-border p-3"
            data-testid={`fitness-exercise-block-${exercise.exerciseId}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-medium">{exercise.nameFrSnapshot}</h2>
              {prExerciseIds.has(exercise.exerciseId) && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  {t("fitness.workout.prBadge")}
                </span>
              )}
            </div>
            {exercise.sets.map((_, setIndex) => {
              const key = setKey(exIndex, setIndex);
              const expanded = expandedSets.has(key);
              const fields = [
                ...layout.visibleFields,
                ...(expanded ? layout.collapsedFields : []),
              ];
              return (
                <div key={setIndex} className="mb-2 space-y-1">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, minmax(0, 1fr))` }}
                  >
                    {fields.map((field) => renderField(field, exercise, exIndex, setIndex))}
                  </div>
                  {layout.collapsedFields.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-muted"
                      onClick={() => toggleExpanded(key)}
                    >
                      {expanded ? "−" : t("fitness.workout.moreFields")}
                    </button>
                  )}
                </div>
              );
            })}
            <button type="button" className="text-xs text-accent" onClick={() => addSet(exIndex)}>
              {t("fitness.workout.addSet")}
            </button>
          </section>
        );
      })}
      <button type="button" className="text-sm text-accent" onClick={() => setPickerOpen(true)}>
        {t("fitness.workout.addExercise")}
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground"
          onClick={() => {
            onComplete();
            if (onRecovery) setShowRecovery(true);
          }}
          data-testid="fitness-workout-complete"
        >
          {t("fitness.action.complete")}
        </button>
        <button type="button" className="rounded-xl border border-border px-4 py-3 text-sm" onClick={onAbandon}>
          {t("fitness.action.abandon")}
        </button>
      </div>
      {showRecovery && onRecovery && (
        <section className="rounded-xl border border-border p-3" data-testid="fitness-recovery-sheet">
          <p className="mb-2 text-sm font-medium">{t("fitness.recovery.title")}</p>
          <label className="block text-xs">
            {t("fitness.recovery.energy")}
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded border border-border px-2 py-1"
              onChange={(e) =>
                onRecovery({
                  energy: Number(e.target.value),
                })
              }
            />
          </label>
        </section>
      )}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(entry) => {
          rememberExerciseId(entry.id);
          onUpdate([
            ...workout.loggedExercises,
            { exerciseId: entry.id, nameFrSnapshot: entry.nameFr, sets: [{}] },
          ]);
        }}
      />
    </div>
  );
}
