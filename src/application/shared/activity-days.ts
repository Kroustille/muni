import type { Item, ItemPatch, ItemStatus, ItemType } from "@/domain/item";
import { parseHlc } from "@/domain/clock";

export const DEFAULT_ACTIVITY_TIMEZONE = "Europe/Paris";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Epoch ms from item `fieldsUpdatedAt` values (HLC), ISO instants, or YYYY-MM-DD. */
export function fieldStampToEpochMs(stamp: string): number | null {
  if (DATE_ONLY.test(stamp)) {
    const [y, m, d] = stamp.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  }
  const isoMs = Date.parse(stamp);
  if (Number.isFinite(isoMs)) return isoMs;
  try {
    return parseHlc(stamp).wallMs;
  } catch {
    return null;
  }
}

/** Calendar day for sync field stamps (HLC) or date-only / ISO strings. */
export function fieldStampToLocalDateKey(stamp: string, timeZone: string): string | null {
  const ms = fieldStampToEpochMs(stamp);
  if (ms == null) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function fieldStampToSortInstant(stamp: string): string {
  const ms = fieldStampToEpochMs(stamp);
  if (ms == null) return stamp;
  return new Date(ms).toISOString();
}

/** YYYY-MM-DD in `timeZone` for true ISO instants (e.g. `createdAt`, `completedAt`). */
export function toLocalDateKey(iso: string, timeZone: string): string | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function addFieldStampActivityDay(days: Set<string>, stamp: string, timeZone: string): void {
  const key = fieldStampToLocalDateKey(stamp, timeZone);
  if (key) days.add(key);
}

export function addLocalActivityDay(days: Set<string>, iso: string, timeZone: string): void {
  const key = toLocalDateKey(iso, timeZone);
  if (key) days.add(key);
}

export type ActivityDayRules<TType extends ItemType> = {
  itemType: TType;
  collectActivityDays(item: Item & { type: TType }, days: Set<string>, timeZone: string): void;
};

/**
 * Returns calendar days (YYYY-MM-DD in `timeZone`) with qualifying activity per `rules`.
 */
export function deriveActivityDays<TType extends ItemType>(
  items: readonly Item[],
  rules: ActivityDayRules<TType>,
  timeZone: string = DEFAULT_ACTIVITY_TIMEZONE,
): Set<string> {
  const days = new Set<string>();

  for (const item of items) {
    if (item.type !== rules.itemType || item.deletedAt != null) continue;
    rules.collectActivityDays(item as Item & { type: TType }, days, timeZone);
  }

  return days;
}

/**
 * Stamps `fieldsUpdatedAt` when a status patch transitions to `whenStatus`.
 */
export function activityStatusTransitionStamp(
  item: Item,
  expectedType: ItemType,
  patch: ItemPatch,
  stamp: string,
  whenStatus: ItemStatus,
  fieldKey: string,
): Record<string, string> {
  if (item.type !== expectedType) return {};
  if (patch.status === undefined || patch.status === item.status) return {};
  if (patch.status !== whenStatus) return {};
  return { [fieldKey]: stamp };
}
