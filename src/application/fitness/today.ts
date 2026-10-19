import type { FitnessProgram, PlannedSession } from "@/domain/fitness/program";
import { isoWeekdayFromCalendarDate } from "@/domain/fitness/adherence";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "@/domain/fitness/workout-log";

export type TodaySessionStatus = "todo" | "in_progress" | "done" | "skipped" | "past";

export type TodayPlannedSession = {
  plannedSession: PlannedSession;
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

export function plannedSessionsForToday(program: FitnessProgram, calendarDate: string): PlannedSession[] {
  const weekday = isoWeekdayFromCalendarDate(calendarDate);
  return program.plannedSessions
    .filter((s) => s.weekdays.includes(weekday))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resolveTodaySessions(
  program: FitnessProgram | undefined,
  logs: FitnessWorkoutLog[],
  skips: FitnessSkipRecord[],
  calendarDate: string,
): TodayPlannedSession[] {
  if (program === undefined || program.deletedAt !== null) return [];
  const planned = plannedSessionsForToday(program, calendarDate);
  return planned.map((session) => {
    const inProgress = logs.find(
      (l) =>
        l.deletedAt === null &&
        l.status === "in_progress" &&
        l.plannedSessionId === session.id &&
        l.calendarDate === calendarDate,
    );
    if (inProgress) {
      return { plannedSession: session, status: "in_progress", workoutId: inProgress.id };
    }
    const completed = logs.some(
      (l) =>
        l.deletedAt === null &&
        l.status === "completed" &&
        l.plannedSessionId === session.id &&
        l.calendarDate === calendarDate,
    );
    if (completed) return { plannedSession: session, status: "done" };
    const skipped = skips.some(
      (s) =>
        s.deletedAt === null &&
        s.plannedSessionId === session.id &&
        s.calendarDate === calendarDate,
    );
    if (skipped) return { plannedSession: session, status: "skipped" };
    const status: TodaySessionStatus =
      calendarDate < localCalendarDate() ? "past" : "todo";
    return { plannedSession: session, status };
  });
}
