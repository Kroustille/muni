import type { Item, ItemStatus, MediaKind } from "@/domain/item";

export function allowedMovieStatuses(mediaKind: MediaKind | null): ItemStatus[] {
  if (mediaKind === "series") {
    return ["to_watch", "in_progress", "paused", "watched"];
  }
  return ["to_watch", "paused", "watched"];
}

export function isMovieStatusAllowed(item: Pick<Item, "mediaKind" | "status">): boolean {
  if (item.status === null) return true;
  return allowedMovieStatuses(item.mediaKind).includes(item.status);
}

export function defaultWatchedAtForStatus(
  status: ItemStatus | null | undefined,
  today: string,
): string | null {
  if (status === "watched") return today;
  return null;
}
