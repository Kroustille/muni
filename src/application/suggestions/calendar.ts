import { DEFAULT_ACTIVITY_TIMEZONE } from "@/application/shared/activity-days";

export const DEFAULT_SUGGESTIONS_TIMEZONE = DEFAULT_ACTIVITY_TIMEZONE;

/** Local calendar day YYYY-MM-DD in `timeZone`. */
export function localCalendarDay(
  nowMs: number = Date.now(),
  timeZone: string = DEFAULT_SUGGESTIONS_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
}

/** Whole local calendar days from anchor (inclusive) to calendarDay. */
export function daysSinceLocalDate(anchorDate: string, calendarDay: string): number {
  const anchor = parseLocalDate(anchorDate);
  const today = parseLocalDate(calendarDay);
  const diffMs = today.getTime() - anchor.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

export function maxLocalDate(...dates: string[]): string {
  return dates.reduce((max, date) => (date > max ? date : max));
}
