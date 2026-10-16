import type { Item } from "@/domain/item";
import { DEFAULT_READING_TIMEZONE } from "./reading-activity";
import {
  countBooksFinishedInYear,
  listActivityDaysInRange,
  longestStreakInRange,
} from "./reading-insights";

export type CountRow = { label: string; count: number };

export type BookStats = {
  year: number;
  finishedByMonth: CountRow[];
  genres: CountRow[];
  tags: CountRow[];
  authors: CountRow[];
  pagesReadTotal: number;
};

export type YearInReview = {
  year: number;
  booksRead: number;
  pagesRead: number;
  topTags: CountRow[];
  topGenres: CountRow[];
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
  if (item.type !== "book" || item.status !== "read") return null;
  return item.fieldsUpdatedAt.read ?? item.fieldsUpdatedAt.status ?? null;
}

function readBooksInYear(items: readonly Item[], year: number, timeZone: string): Item[] {
  return items.filter((item) => {
    if (item.type !== "book" || item.deletedAt != null) return false;
    const at = finishedAt(item);
    return at != null && localYear(at, timeZone) === year;
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

function pagesForBook(item: Item): number {
  if (item.pagesRead != null) return item.pagesRead;
  if (item.pageCount != null) return item.pageCount;
  return 0;
}

export function computeBookStats(
  items: readonly Item[],
  year: number,
  timeZone: string = DEFAULT_READING_TIMEZONE,
): BookStats {
  const read = readBooksInYear(items, year, timeZone);
  const monthCounts = Array.from({ length: 12 }, (_, index) => ({
    label: String(index + 1),
    count: 0,
  }));
  for (const item of read) {
    const at = finishedAt(item);
    if (!at) continue;
    const month = localMonth(at, timeZone) - 1;
    monthCounts[month].count += 1;
  }
  return {
    year,
    finishedByMonth: monthCounts,
    genres: tally(read.flatMap((item) => item.genres ?? [])),
    tags: tally(read.flatMap((item) => item.tags ?? [])),
    authors: tally(read.map((item) => item.author)),
    pagesReadTotal: read.reduce((sum, item) => sum + pagesForBook(item), 0),
  };
}

export function buildYearInReview(
  items: readonly Item[],
  year: number,
  timeZone: string = DEFAULT_READING_TIMEZONE,
): YearInReview {
  const stats = computeBookStats(items, year, timeZone);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const days = listActivityDaysInRange(items, from, to, timeZone);
  return {
    year,
    booksRead: countBooksFinishedInYear(items, year, timeZone),
    pagesRead: stats.pagesReadTotal,
    topTags: stats.tags.slice(0, 3),
    topGenres: stats.genres.slice(0, 3),
    longestStreak: longestStreakInRange(days, from, to),
  };
}
