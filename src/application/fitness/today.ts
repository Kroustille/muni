import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";
import {
  resolveScheduledSessionTitle,
  scheduledRowHasActivity,
  workoutForScheduledOnDate,
} from "@/domain/fitness/scheduled-display";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "@/domain/fitness/workout-log";

export type TodaySessionStatus = "todo" | "in_progress" | "done" | "skipped" | "past";

export type TodayScheduledSession = {
  scheduled: FitnessScheduledSession;
  title: string;
  template: FitnessSessionTemplate | null;
  status: TodaySessionStatus;
  workoutId?: string;
};

export function localCalendarDate(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function resolveTodayScheduledSessions(
  scheduled: FitnessScheduledSession[],
  templates: FitnessSessionTemplate[],
  logs: FitnessWorkoutLog[],
  skips: FitnessSkipRecord[],
  calendarDate: string,
): TodayScheduledSession[] {
  const templateById = new Map(templates.filter((t) => t.deletedAt === null).map((t) => [t.id, t]));
  const rows: TodayScheduledSession[] = [];
  for (const row of scheduled
    .filter((s) => s.deletedAt === null && s.calendarDate === calendarDate)
    .sort((a, b) => a.sortOrder - b.sortOrder)) {
    const template = templateById.get(row.sessionTemplateId);
    if (template === undefined && !scheduledRowHasActivity(row, logs, skips)) {
      continue;
    }
    const title = resolveScheduledSessionTitle(row, template, logs, skips);
    if (title === null) continue;

    const linkedLog = workoutForScheduledOnDate(logs, row.id, calendarDate);
    const inProgress =
      linkedLog !== undefined && linkedLog.status === "in_progress" ? linkedLog : undefined;
    if (inProgress) {
      rows.push({
        scheduled: row,
        title,
        template: template ?? null,
        status: "in_progress",
        workoutId: inProgress.id,
      });
      continue;
    }
    const completed = linkedLog !== undefined && linkedLog.status === "completed";
    if (completed) {
      rows.push({
        scheduled: row,
        title,
        template: template ?? null,
        status: "done",
        workoutId: linkedLog.id,
      });
      continue;
    }
    const skipped = skips.some(
      (s) =>
        s.deletedAt === null && s.scheduledSessionId === row.id && s.calendarDate === calendarDate,
    );
    if (skipped) {
      rows.push({ scheduled: row, title, template: template ?? null, status: "skipped" });
      continue;
    }
    const status: TodaySessionStatus = calendarDate < localCalendarDate() ? "past" : "todo";
    rows.push({ scheduled: row, title, template: template ?? null, status });
  }
  return rows;
}
