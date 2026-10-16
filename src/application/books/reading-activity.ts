import type { Item } from "@/domain/item";
import { statusesFor } from "@/domain/item";

const BOOK_STATUSES = new Set(statusesFor("book"));

export const DEFAULT_READING_TIMEZONE = "Europe/Paris";

function toLocalDateKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function isBookStatus(value: string | null | undefined): boolean {
  return value != null && BOOK_STATUSES.has(value);
}

/**
 * Returns calendar days (YYYY-MM-DD in `timeZone`) with qualifying reading activity (FR-D02).
 */
export function deriveReadingActivityDays(
  items: readonly Item[],
  timeZone: string = DEFAULT_READING_TIMEZONE,
): Set<string> {
  const days = new Set<string>();

  for (const item of items) {
    if (item.type !== "book" || item.deletedAt != null) continue;

    const statusAt = item.fieldsUpdatedAt.status;
    if (statusAt && isBookStatus(item.status)) {
      days.add(toLocalDateKey(statusAt, timeZone));
    }

    const pagesAt = item.fieldsUpdatedAt.pagesRead;
    if (pagesAt) {
      days.add(toLocalDateKey(pagesAt, timeZone));
    }

    if (item.status === "read" && statusAt) {
      days.add(toLocalDateKey(statusAt, timeZone));
    }
  }

  return days;
}
