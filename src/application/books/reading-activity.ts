import type { Item, ItemPatch } from "@/domain/item";
import { statusesFor } from "@/domain/item";
import {
  activityStatusTransitionStamp,
  DEFAULT_ACTIVITY_TIMEZONE,
  deriveActivityDays,
  toLocalDateKey,
  type ActivityDayRules,
} from "@/application/shared/activity-days";

const BOOK_STATUSES = new Set(statusesFor("book"));

export const DEFAULT_READING_TIMEZONE = DEFAULT_ACTIVITY_TIMEZONE;

function isBookStatus(value: string | null | undefined): boolean {
  return value != null && BOOK_STATUSES.has(value);
}

const readingActivityRules: ActivityDayRules<"book"> = {
  itemType: "book",
  collectActivityDays(item, days, timeZone) {
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

    const readAt = item.fieldsUpdatedAt.read;
    if (readAt) {
      days.add(toLocalDateKey(readAt, timeZone));
    }
  },
};

/**
 * Returns calendar days (YYYY-MM-DD in `timeZone`) with qualifying reading activity (FR-D02).
 */
export function deriveReadingActivityDays(
  items: readonly Item[],
  timeZone: string = DEFAULT_READING_TIMEZONE,
): Set<string> {
  return deriveActivityDays(items, readingActivityRules, timeZone);
}

/**
 * Extra `fieldsUpdatedAt` keys for book patches that drive insights (FR-D02).
 * The `read` key records the first mark-as-read timestamp in the calendar year rules.
 */
export function readingActivityFieldStamps(
  item: Item,
  patch: ItemPatch,
  stamp: string,
): Record<string, string> {
  return activityStatusTransitionStamp(item, "book", patch, stamp, "read", "read");
}
