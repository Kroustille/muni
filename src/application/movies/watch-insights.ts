import type { Item } from "@/domain/item";
import { DEFAULT_WATCH_TIMEZONE, deriveWatchActivityDays } from "./watch-activity";

export type HeatmapCell = {
  date: string;
  active: boolean;
};

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function computeStreak(activeDays: ReadonlySet<string>, anchorDate: string): number {
  if (!activeDays.has(anchorDate)) return 0;
  let streak = 0;
  let cursor = parseDateKey(anchorDate);
  while (activeDays.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export function buildActivityHeatmap(
  activeDays: ReadonlySet<string>,
  fromDate: string,
  toDate: string,
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  let cursor = parseDateKey(fromDate);
  const end = parseDateKey(toDate);
  while (cursor <= end) {
    const key = formatDateKey(cursor);
    cells.push({ date: key, active: activeDays.has(key) });
    cursor = addUtcDays(cursor, 1);
  }
  return cells;
}

function yearBounds(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function timestampInYear(iso: string, year: number, timeZone: string): boolean {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return key.startsWith(`${year}-`);
}

export function countMoviesFinishedInYear(
  items: readonly Item[],
  year: number,
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): number {
  let count = 0;
  for (const item of items) {
    if (item.type !== "movie" || item.deletedAt != null || item.status !== "watched") continue;
    const watchedAt = item.fieldsUpdatedAt.watched ?? item.fieldsUpdatedAt.status;
    if (watchedAt && timestampInYear(watchedAt, year, timeZone)) {
      count += 1;
    }
  }
  return count;
}

export function listActivityDaysInRange(
  items: readonly Item[],
  fromDate: string,
  toDate: string,
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): Set<string> {
  const all = deriveWatchActivityDays(items, timeZone);
  const filtered = new Set<string>();
  for (const day of all) {
    if (day >= fromDate && day <= toDate) filtered.add(day);
  }
  return filtered;
}

export function heatmapForYear(
  items: readonly Item[],
  year: number,
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): HeatmapCell[] {
  const { from, to } = yearBounds(year);
  const days = listActivityDaysInRange(items, from, to, timeZone);
  return buildActivityHeatmap(days, from, to);
}

export function longestStreakInRange(
  activeDays: ReadonlySet<string>,
  fromDate: string,
  toDate: string,
): number {
  const cells = buildActivityHeatmap(activeDays, fromDate, toDate);
  let best = 0;
  let current = 0;
  for (const cell of cells) {
    if (cell.active) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}
