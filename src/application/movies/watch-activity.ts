import type { Item, ItemPatch } from "@/domain/item";
import { statusesFor } from "@/domain/item";

const MOVIE_STATUSES = new Set(statusesFor("movie"));

export const DEFAULT_WATCH_TIMEZONE = "Europe/Paris";

function toLocalDateKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function isMovieStatus(value: string | null | undefined): boolean {
  return value != null && MOVIE_STATUSES.has(value);
}

/**
 * Returns calendar days (YYYY-MM-DD in `timeZone`) with qualifying watch activity (FR-D02).
 */
export function deriveWatchActivityDays(
  items: readonly Item[],
  timeZone: string = DEFAULT_WATCH_TIMEZONE,
): Set<string> {
  const days = new Set<string>();

  for (const item of items) {
    if (item.type !== "movie" || item.deletedAt != null) continue;

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
  }

  return days;
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
  const extra: Record<string, string> = {};
  if (patch.status !== undefined && patch.status !== item.status) {
    if (patch.status === "watched") {
      extra.watched = stamp;
    }
  }
  if (patch.episodeProgress !== undefined) {
    extra.episodeProgress = stamp;
  }
  return extra;
}
