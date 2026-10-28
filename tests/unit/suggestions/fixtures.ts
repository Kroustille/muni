/** Europe/Paris calendar fixtures for suggestion unit tests (014). */

export const TZ = "Europe/Paris";

export const CALENDAR_DAY = "2026-10-28";

export function daysAgoIso(days: number, fromDay: string = CALENDAR_DAY): string {
  const [y, m, d] = fromDay.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export function dateOnlyDaysAgo(days: number, fromDay: string = CALENDAR_DAY): string {
  const [y, m, d] = fromDay.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() - days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
