import {
  BOOK_MOODS,
  BOOK_PACES,
  type BookMood,
  type BookPace,
  type Item,
  type ItemStatus,
  type ItemType,
  type MediaKind,
} from "@/domain/item";

export type DiscoveryFilter = {
  status?: ItemStatus | null;
  mood?: BookMood | null;
  pace?: BookPace | null;
  tags?: readonly string[];
  /** Movies only; ignored for books. */
  mediaKind?: MediaKind | null;
};

export function isValidDiscoveryFilter(filter: DiscoveryFilter): boolean {
  if (filter.mood != null && !BOOK_MOODS.includes(filter.mood)) return false;
  if (filter.pace != null && !BOOK_PACES.includes(filter.pace)) return false;
  return true;
}

export function filterItemsByDiscovery(
  items: readonly Item[],
  filter: DiscoveryFilter,
  itemType: ItemType,
): Item[] {
  const mood = filter.mood ?? null;
  const pace = filter.pace ?? null;
  const status = filter.status ?? null;
  const mediaKind = itemType === "movie" ? (filter.mediaKind ?? null) : null;
  const tags = filter.tags?.filter((tag) => tag.trim() !== "") ?? [];

  const hasConstraint =
    mood !== null ||
    pace !== null ||
    status !== null ||
    mediaKind !== null ||
    tags.length > 0;
  if (!hasConstraint) return [...items];

  return items.filter((item) => {
    if (item.type !== itemType) return false;
    if (status !== null && item.status !== status) return false;
    if (mood !== null && item.mood !== mood) return false;
    if (pace !== null && item.pace !== pace) return false;
    if (mediaKind !== null && item.mediaKind !== mediaKind) return false;
    if (tags.length > 0) {
      const itemTags = item.tags ?? [];
      if (!tags.some((tag) => itemTags.includes(tag))) return false;
    }
    return true;
  }) as Item[];
}
