"use client";

import { useEffect, useState } from "react";

import { getPracticeExerciseUseCases, getPracticePlanUseCases } from "@/composition/client";
import type { PlanAssignment, PracticePlan } from "@/domain/practice-plan";
import type { PracticeExercise } from "@/domain/practice-exercise";
import { t } from "@/i18n";

export function PlanEditor() {
  const [plan, setPlan] = useState<PracticePlan | undefined>();
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [name, setName] = useState("");
  const [pickExerciseId, setPickExerciseId] = useState("");

  const refresh = async () => {
    const planUc = await getPracticePlanUseCases();
    const exerciseUc = await getPracticeExerciseUseCases();
    let active = await planUc.getActivePlan();
    if (active === undefined || active.deletedAt !== null) {
      active = await planUc.createPlan({ name: t("musicPractice.plan.name") });
    }
    setPlan(active);
    setName(active.name);
    setExercises((await exerciseUc.listExercises()).filter((row) => row.deletedAt === null));
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (plan === undefined) return null;

  const savePlan = async (next: PracticePlan) => {
    const planUc = await getPracticePlanUseCases();
    const saved = await planUc.upsertPlan(next);
    setPlan(saved);
  };

  const addAssignment = async () => {
    if (!pickExerciseId) return;
    const assignment: PlanAssignment = {
      id: crypto.randomUUID(),
      exerciseId: pickExerciseId,
      weekdays: [new Date().getDay() === 0 ? 7 : new Date().getDay()],
      specificDates: null,
      sortOrder: plan.assignments.length,
    };
    await savePlan({ ...plan, name: name.trim() || plan.name, assignments: [...plan.assignments, assignment] });
    setPickExerciseId("");
  };

  return (
    <section className="space-y-3 rounded-xl border border-border p-3" data-testid="plan-editor">
      <h2 className="text-sm font-medium">{t("musicPractice.apprentissage.plan")}</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={t("musicPractice.plan.name")}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="plan-name"
      />
      <select
        value={pickExerciseId}
        onChange={(e) => setPickExerciseId(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="plan-pick-exercise"
      >
        <option value="">—</option>
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {exercise.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="rounded-lg border border-border px-3 py-2 text-sm"
        onClick={() => void addAssignment()}
        data-testid="plan-add-assignment"
      >
        {t("action.add")}
      </button>
      <button
        type="button"
        className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground"
        onClick={() => void savePlan({ ...plan, name: name.trim() || plan.name })}
        data-testid="plan-save"
      >
        {t("musicPractice.plan.save")}
      </button>
      <ul className="text-sm">
        {plan.assignments.map((assignment) => {
          const exercise = exercises.find((row) => row.id === assignment.exerciseId);
          return (
            <li key={assignment.id} data-testid={`plan-assignment-${assignment.id}`}>
              {exercise?.title ?? assignment.exerciseId}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
