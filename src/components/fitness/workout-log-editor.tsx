"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { FitnessWorkoutLog, LoggedExercise } from "@/domain/fitness/workout-log";
import { resolveSetInputLayout, type SetField } from "@/domain/fitness/set-input-layout";
import { ExercisePicker } from "@/components/fitness/exercise-picker";
import {
  exerciseNameFromCatalog,
  useExerciseCatalogMap,
} from "@/components/fitness/use-exercise-catalog";
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

function fieldLabel(field: SetField): string {
  switch (field) {
    case "reps":
      return t("fitness.workout.reps");
    case "charge":
      return t("fitness.workout.charge");
    case "duration":
      return t("fitness.workout.duration");
    case "distanceNote":
      return t("fitness.workout.distanceNote");
    default:
      return t("fitness.workout.rpe");
  }
}

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
  const catalogById = useExerciseCatalogMap();
  const [loggedExercises, setLoggedExercises] = useState(workout.loggedExercises);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setLoggedExercises(workout.loggedExercises);
  }, [workout.id, workout.loggedExercises]);

  const commitLoggedExercises = (next: LoggedExercise[]) => {
    setLoggedExercises(next);
    onUpdate(next);
  };

  const updateExercise = (index: number, exercise: LoggedExercise) => {
    const next = [...loggedExercises];
    next[index] = exercise;
    commitLoggedExercises(next);
  };

  const addSet = (index: number) => {
    const exercise = loggedExercises[index];
    if (exercise === undefined) return;
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

    const label = fieldLabel(field);
    const wrap = (key: string, input: ReactNode) => (
      <label key={key} className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
        {input}
      </label>
    );

    if (field === "reps") {
      return wrap(
        "reps",
        <input
          type="number"
          min={0}
          placeholder={label}
          className="w-full rounded border border-border px-2 py-1 text-sm"
          value={set.reps ?? ""}
          data-testid="fitness-set-reps"
          onChange={(e) => {
            const sets = [...exercise.sets];
            sets[setIndex] = { ...set, reps: e.target.value ? Number(e.target.value) : undefined };
            updateExercise(exIndex, { ...exercise, sets });
          }}
        />,
      );
    }
    if (field === "charge") {
      return wrap(
        "charge",
        <input
          type="number"
          min={0}
          step="0.5"
          placeholder={label}
          className="w-full rounded border border-border px-2 py-1 text-sm"
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
        />,
      );
    }
    if (field === "duration") {
      return wrap(
        "duration",
        <input
          type="number"
          min={0}
          placeholder={label}
          className="w-full rounded border border-border px-2 py-1 text-sm"
          value={set.durationSeconds !== undefined ? set.durationSeconds / 60 : ""}
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
        />,
      );
    }
    if (field === "distanceNote") {
      return wrap(
        "distanceNote",
        <input
          type="text"
          placeholder={label}
          className="w-full rounded border border-border px-2 py-1 text-sm"
          value={set.distanceNote ?? ""}
          onChange={(e) => {
            const sets = [...exercise.sets];
            sets[setIndex] = {
              ...set,
              distanceNote: e.target.value.trim() || undefined,
            };
            updateExercise(exIndex, { ...exercise, sets });
          }}
        />,
      );
    }
    return wrap(
      "rpe",
      <input
        type="number"
        min={1}
        max={10}
        placeholder={label}
        className="w-full rounded border border-border px-2 py-1 text-sm"
        value={set.rpe ?? ""}
        onChange={(e) => {
          const sets = [...exercise.sets];
          sets[setIndex] = { ...set, rpe: e.target.value ? Number(e.target.value) : undefined };
          updateExercise(exIndex, { ...exercise, sets });
        }}
        data-testid="fitness-set-rpe"
      />,
    );
  };

  return (
    <div className="space-y-4" data-testid="fitness-workout-editor">
      <h1 className="font-serif text-xl font-semibold">{workout.title}</h1>
      {loggedExercises.map((exercise, exIndex) => {
        const layout = resolveSetInputLayout(catalogById.get(exercise.exerciseId));
        const title =
          exercise.nameFrSnapshot || exerciseNameFromCatalog(catalogById, exercise.exerciseId);
        return (
          <section
            key={`${exercise.exerciseId}-${exIndex}`}
            className="rounded-xl border border-border p-3"
            data-testid={`fitness-exercise-block-${exercise.exerciseId}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-medium">{title}</h2>
              {prExerciseIds.has(exercise.exerciseId) && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  {t("fitness.workout.prBadge")}
                </span>
              )}
            </div>
            {exercise.sets.length === 0 && (
              <p className="mb-2 text-xs text-muted">{t("fitness.workout.noSets")}</p>
            )}
            {exercise.sets.map((_, setIndex) => {
              const key = setKey(exIndex, setIndex);
              const expanded = expandedSets.has(key);
              const fields = [...layout.visibleFields, ...(expanded ? layout.collapsedFields : [])];
              return (
                <div key={setIndex} className="mb-2 space-y-1">
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(fields.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {fields.map((field) => renderField(field, exercise, exIndex, setIndex))}
                  </div>
                  {layout.collapsedFields.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-accent"
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
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-3 text-sm"
          onClick={onAbandon}
        >
          {t("fitness.action.abandon")}
        </button>
      </div>
      {showRecovery && onRecovery && (
        <section
          className="rounded-xl border border-border p-3"
          data-testid="fitness-recovery-sheet"
        >
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
          commitLoggedExercises([
            ...loggedExercises,
            { exerciseId: entry.id, nameFrSnapshot: entry.nameFr, sets: [{}] },
          ]);
        }}
      />
    </div>
  );
}
