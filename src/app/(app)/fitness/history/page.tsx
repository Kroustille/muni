"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getFitnessWorkoutUseCases } from "@/composition/client";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import { normalizeText } from "@/domain/text";
import { t } from "@/i18n";

export default function FitnessHistoryPage() {
  const [logs, setLogs] = useState<FitnessWorkoutLog[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void getFitnessWorkoutUseCases().then((uc) => uc.listWorkouts().then(setLogs));
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!q) return logs;
    return logs.filter((log) =>
      log.loggedExercises.some((ex) => normalizeText(ex.nameFrSnapshot).includes(q)) ||
      normalizeText(log.title).includes(q),
    );
  }, [logs, query]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="fitness-history">
      <h1 className="font-serif text-2xl font-semibold">{t("fitness.history.title")}</h1>
      <input
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder={t("fitness.history.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="fitness-history-search"
      />
      <ul className="space-y-2">
        {filtered.map((log) => (
          <li key={log.id} className="flex items-center justify-between rounded-xl border border-border p-3">
            <Link href={`/fitness/workout/${log.id}`} className="text-sm font-medium">
              {log.title} — {log.calendarDate}
            </Link>
            <button
              type="button"
              className="text-xs text-accent"
              onClick={async () => {
                const uc = await getFitnessWorkoutUseCases();
                const dup = await uc.duplicateWorkoutAsTemplate(log.id);
                window.location.assign(`/fitness/workout/${dup.id}`);
              }}
            >
              {t("fitness.action.duplicate")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
