import type { Item, ItemPatch, ItemStatus, ItemType } from "@/domain/item";

export const DEFAULT_ACTIVITY_TIMEZONE = "Europe/Paris";

export function toLocalDateKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
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
