"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFitnessProgramUseCases, getFitnessUserSettings, getFitnessWorkoutUseCases } from "@/composition/client";
import { computeAdherenceStreak } from "@/application/fitness/adherence-streak";
import { buildWeekAdherenceView } from "@/domain/fitness/adherence";
import { defaultFitnessUserSettings } from "@/domain/fitness/workout-log";
import { localCalendarDate, plannedSessionsForToday } from "@/application/fitness/today";
import { t } from "@/i18n";

export function HomeFitnessCard() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const programUseCases = await getFitnessProgramUseCases();
      const workoutUseCases = await getFitnessWorkoutUseCases();
      const program = await programUseCases.getActiveProgram();
      if (program === undefined) return;
      const logs = await workoutUseCases.listWorkouts();
      const settings = (await getFitnessUserSettings()) ?? defaultFitnessUserSettings();
      const week = buildWeekAdherenceView(program, logs, [], localCalendarDate());
      const streak = computeAdherenceStreak(logs, settings);
      const todaySessions = plannedSessionsForToday(program, localCalendarDate());
      const next = todaySessions[0]?.title;
      const parts = [t("fitness.homeCard.weekDone").replace("{done}", String(week.completedCount))];
      if (settings.adherenceTrackingEnabled && streak > 0) {
        parts.push(t("fitness.homeCard.streak").replace("{count}", String(streak)));
      }
      if (next) parts.push(t("fitness.homeCard.next").replace("{title}", next));
      setText(parts.join(" · "));
    })();
  }, []);

  if (text === null) return null;

  return (
    <section
      className="rounded-xl border border-border bg-surface p-3"
      data-testid="home-fitness-card"
      aria-label={t("fitness.homeCard.title")}
    >
      <Link href="/fitness" className="block">
        <p className="text-sm font-medium text-accent">{t("fitness.homeCard.title")}</p>
        <p className="mt-1 text-xs text-muted">{text}</p>
      </Link>
    </section>
  );
}
