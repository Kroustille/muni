"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ensureFitnessCatalogSeeded,
  getFitnessScheduleUseCases,
  getFitnessSessionTemplateUseCases,
  getFitnessWorkoutUseCases,
} from "@/composition/client";
import { buildWeekAdherenceView } from "@/domain/fitness/adherence";
import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import {
  resolveTodayScheduledSessions,
  localCalendarDate,
  type TodayScheduledSession,
} from "@/application/fitness/today";
import { WeekAdherenceStrip } from "@/components/fitness/week-strip";
import { t } from "@/i18n";

function statusLabel(status: TodayScheduledSession["status"]): string {
  switch (status) {
    case "todo":
      return t("fitness.today.todo");
    case "in_progress":
      return t("fitness.today.inProgress");
    case "done":
      return t("fitness.today.done");
    case "skipped":
      return t("fitness.today.skipped");
    default:
      return t("fitness.today.past");
  }
}

export function FitnessHome() {
  const [templates, setTemplates] = useState<FitnessSessionTemplate[]>([]);
  const [scheduled, setScheduled] = useState<FitnessScheduledSession[]>([]);
  const [logs, setLogs] = useState<FitnessWorkoutLog[]>([]);
  const [skips, setSkips] = useState<FitnessSkipRecord[]>([]);
  const [today, setToday] = useState<TodayScheduledSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pickedTemplateId, setPickedTemplateId] = useState<string>("");

  const refresh = async () => {
    const templateUseCases = await getFitnessSessionTemplateUseCases();
    const scheduleUseCases = await getFitnessScheduleUseCases();
    const workoutUseCases = await getFitnessWorkoutUseCases();
    const allTemplates = await templateUseCases.listTemplates();
    const allScheduled = await scheduleUseCases.listScheduled();
    const allLogs = await workoutUseCases.listWorkouts();
    const allSkips = await workoutUseCases.listSkips();
    const todayDate = localCalendarDate();
    setTemplates(allTemplates);
    setScheduled(allScheduled);
    setLogs(allLogs);
    setSkips(allSkips);
    setToday(
      resolveTodayScheduledSessions(
        allScheduled,
        allTemplates,
        allLogs,
        allSkips,
        todayDate,
      ),
    );
  };

  useEffect(() => {
    void ensureFitnessCatalogSeeded().then(refresh);
  }, []);

  useEffect(() => {
    setToday(resolveTodayScheduledSessions(scheduled, templates, logs, skips, localCalendarDate()));
  }, [templates, scheduled, logs, skips]);

  useEffect(() => {
    const sorted = templates
      .filter((t) => t.deletedAt === null)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "fr"));
    if (sorted.length === 0) {
      setPickedTemplateId("");
      return;
    }
    setPickedTemplateId((current) =>
      sorted.some((t) => t.id === current) ? current : sorted[0]!.id,
    );
  }, [templates]);

  const activeTemplates = templates.filter((t) => t.deletedAt === null);
  const sortedTemplates = [...activeTemplates].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "fr"),
  );
  const weekView = buildWeekAdherenceView(scheduled, templates, logs, skips, localCalendarDate());

  const startSession = async (session: TodayScheduledSession) => {
    try {
      const workoutUseCases = await getFitnessWorkoutUseCases();
      const log = await workoutUseCases.startWorkoutFromTemplate(session.template, session.scheduled);
      window.location.assign(`/fitness/workout/${log.id}`);
    } catch (e) {
      if (e instanceof Error && e.message === "WORKOUT_IN_PROGRESS") {
        setError(t("fitness.inProgress.modal"));
      }
    }
  };

  const startFree = async () => {
    try {
      const workoutUseCases = await getFitnessWorkoutUseCases();
      const log = await workoutUseCases.startFreeWorkout();
      window.location.assign(`/fitness/workout/${log.id}`);
    } catch (e) {
      if (e instanceof Error && e.message === "WORKOUT_IN_PROGRESS") {
        setError(t("fitness.inProgress.modal"));
      }
    }
  };

  const startPickedTemplate = async (templateId: string) => {
    const template = activeTemplates.find((row) => row.id === templateId);
    if (template === undefined) return;
    try {
      const workoutUseCases = await getFitnessWorkoutUseCases();
      const log = await workoutUseCases.startWorkoutFromTemplate(template);
      window.location.assign(`/fitness/workout/${log.id}`);
    } catch (e) {
      if (e instanceof Error && e.message === "WORKOUT_IN_PROGRESS") {
        setError(t("fitness.inProgress.modal"));
      }
    }
  };

  if (activeTemplates.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-4" data-testid="fitness-home-empty">
        <p className="mb-4 text-muted">{t("fitness.home.empty")}</p>
        <Link
          href="/fitness/sessions"
          className="inline-flex rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
        >
          {t("fitness.home.createSessions")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="fitness-home">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">{t("fitness.home.title")}</h1>
        <Link href="/fitness/sessions" className="text-sm text-accent">
          {t("fitness.home.editSessions")}
        </Link>
      </header>
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      <WeekAdherenceStrip view={weekView} />
      <section>
        <ul className="space-y-2">
          {today.map((session) => (
            <li
              key={session.scheduled.id}
              className="flex items-center justify-between rounded-xl border border-border p-3"
            >
              <div>
                <p className="font-medium">{session.template.title}</p>
                <p className="text-xs text-muted">{statusLabel(session.status)}</p>
              </div>
              {session.status === "todo" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground"
                    onClick={() => startSession(session)}
                    data-testid="fitness-start-session"
                  >
                    {t("fitness.action.start")}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-xs"
                    onClick={async () => {
                      const workoutUseCases = await getFitnessWorkoutUseCases();
                      await workoutUseCases.skipScheduledSession(session.scheduled.id);
                      await refresh();
                    }}
                  >
                    {t("fitness.action.skip")}
                  </button>
                </div>
              )}
              {session.status === "in_progress" && session.workoutId && (
                <Link href={`/fitness/workout/${session.workoutId}`} className="text-sm text-accent">
                  {t("fitness.today.inProgress")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
      {sortedTemplates.length > 0 && (
        <section data-testid="fitness-session-picker-section">
          <p className="mb-2 text-sm font-medium">{t("fitness.home.pickSession")}</p>
          <div className="flex gap-2">
            <select
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={pickedTemplateId}
              data-testid="fitness-session-picker"
              onChange={(e) => setPickedTemplateId(e.target.value)}
            >
              {sortedTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground"
              data-testid="fitness-start-picked-session"
              onClick={() => {
                if (pickedTemplateId) void startPickedTemplate(pickedTemplateId);
              }}
            >
              {t("fitness.action.start")}
            </button>
          </div>
        </section>
      )}
      <button
        type="button"
        className="w-full rounded-xl border border-border py-3 text-sm"
        onClick={startFree}
        data-testid="fitness-free-workout"
      >
        {t("fitness.home.freeWorkout")}
      </button>
      <section>
        <p className="mb-2 text-sm font-medium">{t("fitness.home.recent")}</p>
        <ul className="space-y-1">
          {logs.slice(0, 5).map((log) => (
            <li key={log.id}>
              <Link href={`/fitness/workout/${log.id}`} className="text-sm text-accent">
                {log.title} — {log.calendarDate}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/fitness/history" className="mt-2 inline-block text-sm text-muted">
          {t("fitness.history.title")}
        </Link>
      </section>
    </div>
  );
}
