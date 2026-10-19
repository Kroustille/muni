"use client";

import { useState } from "react";
import type { PlannedSession } from "@/domain/fitness/program";
import { ExercisePicker } from "@/components/fitness/exercise-picker";
import { rememberExerciseId } from "@/application/fitness/recent-exercises";
import { t } from "@/i18n";

const WEEKDAYS = [
  { value: 1, label: "fitness.weekday.mon" },
  { value: 2, label: "fitness.weekday.tue" },
  { value: 3, label: "fitness.weekday.wed" },
  { value: 4, label: "fitness.weekday.thu" },
  { value: 5, label: "fitness.weekday.fri" },
  { value: 6, label: "fitness.weekday.sat" },
  { value: 7, label: "fitness.weekday.sun" },
] as const;

type ProgramEditorProps = {
  name: string;
  sessions: PlannedSession[];
  onNameChange: (name: string) => void;
  onSessionsChange: (sessions: PlannedSession[]) => void;
  onSave: () => void;
};

export function ProgramEditor({ name, sessions, onNameChange, onSessionsChange, onSave }: ProgramEditorProps) {
  const [pickerSessionId, setPickerSessionId] = useState<string | null>(null);

  const addSession = () => {
    const session: PlannedSession = {
      id: crypto.randomUUID(),
      title: "Séance",
      weekdays: [1],
      sortOrder: sessions.length,
      exercises: [],
    };
    onSessionsChange([...sessions, session]);
  };

  const updateSession = (id: string, patch: Partial<PlannedSession>) => {
    onSessionsChange(sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-4" data-testid="fitness-program-editor">
      <label className="block text-sm">
        <span className="text-muted">{t("fitness.program.name")}</span>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          data-testid="fitness-program-name"
        />
      </label>
      {sessions.map((session) => (
        <section key={session.id} className="rounded-xl border border-border p-3">
          <input
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium"
            value={session.title}
            onChange={(e) => updateSession(session.id, { title: e.target.value })}
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {WEEKDAYS.map(({ value, label }) => {
              const active = session.weekdays.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full px-2 py-1 text-xs ${active ? "bg-accent text-accent-foreground" : "bg-background"}`}
                  onClick={() => {
                    const weekdays = active
                      ? session.weekdays.filter((d) => d !== value)
                      : [...session.weekdays, value].sort();
                    updateSession(session.id, { weekdays });
                  }}
                >
                  {t(label)}
                </button>
              );
            })}
          </div>
          <ul className="mb-2 space-y-1">
            {session.exercises.map((ex, index) => (
              <li key={`${session.id}-${ex.exerciseId}-${index}`} className="text-sm text-foreground">
                {ex.exerciseId}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-sm text-accent"
            onClick={() => setPickerSessionId(session.id)}
          >
            {t("fitness.workout.addExercise")}
          </button>
        </section>
      ))}
      <button type="button" className="text-sm text-accent" onClick={addSession}>
        {t("fitness.program.addSession")}
      </button>
      <button
        type="button"
        className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground"
        onClick={onSave}
        data-testid="fitness-program-save"
      >
        {t("fitness.action.save")}
      </button>
      <ExercisePicker
        open={pickerSessionId !== null}
        onClose={() => setPickerSessionId(null)}
        onSelect={(entry) => {
          if (pickerSessionId === null) return;
          rememberExerciseId(entry.id);
          const session = sessions.find((s) => s.id === pickerSessionId);
          if (session === undefined) return;
          updateSession(pickerSessionId, {
            exercises: [...session.exercises, { exerciseId: entry.id }],
          });
        }}
      />
    </div>
  );
}
