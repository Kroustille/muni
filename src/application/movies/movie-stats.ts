import type { Item } from "@/domain/item";
import { DEFAULT_WATCH_TIMEZONE } from "./watch-activity";
import {
  countMoviesFinishedInYear,
  listActivityDaysInRange,
  longestStreakInRange,
} from "./watch-insights";

export type CountRow = { label: string; count: number };

export type MovieStats = {
  year: number;
  finishedByMonth: CountRow[];
  mediaKinds: CountRow[];
  tags: CountRow[];
  franchises: CountRow[];
};

export type MovieYearInReview = {
  year: number;
  moviesWatched: number;
  topTags: CountRow[];
  topFranchises: CountRow[];
  longestStreak: number;
};

function localYear(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric" }).format(new Date(iso)),
  );
}

function localMonth(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone, month: "numeric" }).format(new Date(iso)),
  );
}

function finishedAt(item: Item): string | null {
  if (item.type !== "movie" || item.status !== "watched") return null;
  return item.fieldsUpdatedAt.watched ?? item.fieldsUpdatedAt.status ?? item.watchedAt ?? null;
}

function watchedMoviesInYear(items: readonly Item[], year: number, timeZone: string): Item[] {
  return items.filter((item) => {
    if (item.type !== "movie" || item.deletedAt != null) return false;
    const at = finishedAt(item);
    if (at == null) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(at)) {
      return at.startsWith(`${year}-`);
    }
    return localYear(at, timeZone) === year;
  }) as Item[];
}

function tally(values: (string | null | undefined)[]): CountRow[] {
  const map = new Map<string, number>();
  for (const value of values) {
    if (value == null || value.trim() === "") continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}

export function computeMovieStats(
  items: readonly Item[],
  year: number,
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): MovieStats {
  const watched = watchedMoviesInYear(items, year, timeZone);
  const monthCounts = Array.from({ length: 12 }, (_, index) => ({
    label: String(index + 1),
    count: 0,
  }));
  for (const item of watched) {
    const at = finishedAt(item);
    if (!at) continue;
    const month = /^\d{4}-\d{2}-\d{2}$/.test(at)
      ? Number(at.slice(5, 7)) - 1
      : localMonth(at, timeZone) - 1;
    monthCounts[month].count += 1;
  }
  return {
    year,
    finishedByMonth: monthCounts,
    mediaKinds: tally(watched.map((item) => item.mediaKind)),
    tags: tally(watched.flatMap((item) => item.tags ?? [])),
    franchises: tally(watched.map((item) => item.franchiseName)),
  };
}

export function buildMovieYearInReview(
  items: readonly Item[],
  year: number,
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): MovieYearInReview {
  const stats = computeMovieStats(items, year, timeZone);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const days = listActivityDaysInRange(items, from, to, timeZone);
  return {
    year,
    moviesWatched: countMoviesFinishedInYear(items, year, timeZone),
    topTags: stats.tags.slice(0, 3),
    topFranchises: stats.franchises.slice(0, 3),
    longestStreak: longestStreakInRange(days, from, to),
  };
}
