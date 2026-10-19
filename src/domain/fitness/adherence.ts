import type { FitnessProgram, PlannedSession } from "./program";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "./workout-log";

/** Monday = 1 … Sunday = 7 (ISO weekday). */
export function isoWeekdayFromCalendarDate(calendarDate: string): number {
  const [y, m, d] = calendarDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function startOfWeekMonday(calendarDate: string): string {
  const [y, m, d] = calendarDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = isoWeekdayFromCalendarDate(calendarDate);
  date.setDate(date.getDate() - (weekday - 1));
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function datesInWeek(weekStartMonday: string): string[] {
  const [y, m, d] = weekStartMonday.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const yy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, "0");
    const dd = String(cur.getDate()).padStart(2, "0");
    dates.push(`${yy}-${mm}-${dd}`);
  }
  return dates;
}

export type SessionDayStatus = "planned" | "completed" | "skipped" | "none";

export type WeekAdherenceSession = {
  plannedSessionId: string;
  title: string;
  calendarDate: string;
  status: SessionDayStatus;
};

export type WeekAdherenceView = {
  weekStart: string;
  sessions: WeekAdherenceSession[];
  plannedCount: number;
  completedCount: number;
  skippedCount: number;
};

function plannedSessionsForDate(program: FitnessProgram, calendarDate: string): PlannedSession[] {
  const weekday = isoWeekdayFromCalendarDate(calendarDate);
  return program.plannedSessions
    .filter((s) => s.weekdays.includes(weekday))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildWeekAdherenceView(
  program: FitnessProgram | null,
  logs: FitnessWorkoutLog[],
  skips: FitnessSkipRecord[],
  referenceDate: string,
): WeekAdherenceView {
  const weekStart = startOfWeekMonday(referenceDate);
  const weekDates = datesInWeek(weekStart);
  const sessions: WeekAdherenceSession[] = [];

  if (program !== null && program.deletedAt === null) {
    for (const date of weekDates) {
      for (const planned of plannedSessionsForDate(program, date)) {
        const completed = logs.some(
          (l) =>
            l.deletedAt === null &&
            l.status === "completed" &&
            l.calendarDate === date &&
            l.plannedSessionId === planned.id,
        );
        const skipped = skips.some(
          (s) =>
            s.deletedAt === null && s.calendarDate === date && s.plannedSessionId === planned.id,
        );
        let status: SessionDayStatus = "planned";
        if (completed) status = "completed";
        else if (skipped) status = "skipped";
        sessions.push({
          plannedSessionId: planned.id,
          title: planned.title,
          calendarDate: date,
          status,
        });
      }
    }
  }

  const plannedCount = sessions.filter((s) => s.status === "planned" || s.status === "completed" || s.status === "skipped").length;
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const skippedCount = sessions.filter((s) => s.status === "skipped").length;

  return {
    weekStart,
    sessions,
    plannedCount,
    completedCount,
    skippedCount,
  };
}

export function countCompletedWorkoutsInWeek(
  logs: FitnessWorkoutLog[],
  weekStartMonday: string,
): number {
  const weekDates = new Set(datesInWeek(weekStartMonday));
  return logs.filter(
    (l) =>
      l.deletedAt === null &&
      l.status === "completed" &&
      weekDates.has(l.calendarDate),
  ).length;
}
