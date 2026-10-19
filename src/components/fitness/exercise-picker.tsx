"use client";

import { useEffect, useMemo, useState } from "react";
import {
  filterCatalogByMuscle,
  searchCatalogExercises,
  type ExerciseCatalogEntry,
  type MusclesCatalogDocument,
} from "@/domain/fitness/catalog";
import { loadRecentExerciseIds } from "@/application/fitness/recent-exercises";
import { t } from "@/i18n";

type ExercisePickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: ExerciseCatalogEntry) => void;
};

export function ExercisePicker({ open, onClose, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<ExerciseCatalogEntry[]>([]);
  const [muscles, setMuscles] = useState<MusclesCatalogDocument["muscles"]>([]);
  const [query, setQuery] = useState("");
  const [muscleId, setMuscleId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fetch("/fitness/exercises.catalog.json").then((r) => r.json()),
      fetch("/fitness/muscles.catalog.json").then((r) => r.json()),
    ]).then(([exDoc, musDoc]) => {
      setExercises(exDoc.exercises ?? []);
      setMuscles(musDoc.muscles ?? []);
    });
  }, [open]);

  const recentIds = useMemo(() => loadRecentExerciseIds(), [open]);
  const recent = exercises.filter((e) => recentIds.includes(e.id));

  const filtered = useMemo(() => {
    let list = filterCatalogByMuscle(exercises, muscleId);
    list = searchCatalogExercises(list, query);
    return list;
  }, [exercises, muscleId, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-xl border border-border bg-surface"
        role="dialog"
        aria-label={t("fitness.picker.title")}
        data-testid="fitness-exercise-picker"
      >
        <div className="border-b border-border p-3">
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder={t("fitness.picker.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="fitness-exercise-search"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className={`rounded-full px-2 py-1 text-xs ${muscleId === null ? "bg-accent text-accent-foreground" : "bg-background"}`}
              onClick={() => setMuscleId(null)}
            >
              {t("fitness.picker.allMuscles")}
            </button>
            {muscles
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`rounded-full px-2 py-1 text-xs ${muscleId === m.id ? "bg-accent text-accent-foreground" : "bg-background"}`}
                  onClick={() => setMuscleId(m.id)}
                >
                  {m.nameFr}
                </button>
              ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {recent.length > 0 && query.trim() === "" && muscleId === null && (
            <section className="mb-3">
              <p className="px-2 text-xs font-medium text-muted">{t("fitness.picker.recent")}</p>
              <ul>
                {recent.map((entry) => (
                  <li key={`recent-${entry.id}`}>
                    <button
                      type="button"
                      className="flex w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-background"
                      onClick={() => {
                        onSelect(entry);
                        onClose();
                      }}
                    >
                      {entry.nameFr}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ul>
            {filtered.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="flex w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-background"
                  onClick={() => {
                    onSelect(entry);
                    onClose();
                  }}
                >
                  {entry.nameFr}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-border p-3">
          <button type="button" className="w-full rounded-lg py-2 text-sm" onClick={onClose}>
            {t("action.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
