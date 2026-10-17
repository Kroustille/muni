import type { Item, ItemPatch } from "@/domain/item";
import { statusesFor } from "@/domain/item";
import {
  activityStatusTransitionStamp,
  DEFAULT_ACTIVITY_TIMEZONE,
  deriveActivityDays,
  toLocalDateKey,
  type ActivityDayRules,
} from "@/application/shared/activity-days";

const MOVIE_STATUSES = new Set(statusesFor("movie"));

export const DEFAULT_WATCH_TIMEZONE = DEFAULT_ACTIVITY_TIMEZONE;

function isMovieStatus(value: string | null | undefined): boolean {
  return value != null && MOVIE_STATUSES.has(value);
}

const watchActivityRules: ActivityDayRules<"movie"> = {
  itemType: "movie",
  collectActivityDays(item, days, timeZone) {
    const statusAt = item.fieldsUpdatedAt.status;
    if (statusAt && isMovieStatus(item.status)) {
      days.add(toLocalDateKey(statusAt, timeZone));
    }

    if (item.watchedAt) {
      days.add(item.watchedAt);
    }

    const episodeAt = item.fieldsUpdatedAt.episodeProgress;
    if (episodeAt) {
      days.add(toLocalDateKey(episodeAt, timeZone));
    }

    if (item.episodeProgress) {
      for (const entry of Object.values(item.episodeProgress)) {
        if (entry.watchedAt) days.add(entry.watchedAt);
      }
    }

    if (item.status === "watched" && statusAt) {
      days.add(toLocalDateKey(statusAt, timeZone));
    }

    const watchedStamp = item.fieldsUpdatedAt.watched;
    if (watchedStamp) {
      days.add(toLocalDateKey(watchedStamp, timeZone));
    }
  },
};

/**
 * Returns calendar days (YYYY-MM-DD in `timeZone`) with qualifying watch activity (FR-D02).
 */
export function deriveWatchActivityDays(
  items: readonly Item[],
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): Set<string> {
  return deriveActivityDays(items, watchActivityRules, timeZone);
}

/**
 * Extra `fieldsUpdatedAt` keys for movie patches that drive insights (FR-D02).
 */
export function watchActivityFieldStamps(
  item: Item,
  patch: ItemPatch,
  stamp: string,
): Record<string, string> {
  if (item.type !== "movie") return {};
  const extra = activityStatusTransitionStamp(item, "movie", patch, stamp, "watched", "watched");
  if (patch.episodeProgress !== undefined) {
    extra.episodeProgress = stamp;
  }
  return extra;
}
