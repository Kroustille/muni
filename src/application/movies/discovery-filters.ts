import { BOOK_MOODS, BOOK_PACES, type BookMood, type BookPace, type Item, type ItemStatus } from "@/domain/item";

export type MovieDiscoveryFilter = {
  status?: ItemStatus | null;
  mood?: BookMood | null;
  pace?: BookPace | null;
  tags?: readonly string[];
};

export function isValidMovieDiscoveryFilter(filter: MovieDiscoveryFilter): boolean {
  if (filter.mood != null && !BOOK_MOODS.includes(filter.mood)) return false;
  if (filter.pace != null && !BOOK_PACES.includes(filter.pace)) return false;
  return true;
}

export function filterMoviesByDiscovery(
  items: readonly Item[],
  filter: MovieDiscoveryFilter,
): Item[] {
  const mood = filter.mood ?? null;
  const pace = filter.pace ?? null;
  const status = filter.status ?? null;
  const tags = filter.tags?.filter((tag) => tag.trim() !== "") ?? [];

  const hasConstraint =
    mood !== null || pace !== null || status !== null || tags.length > 0;
  if (!hasConstraint) return [...items];

  return items.filter((item) => {
    if (item.type !== "movie") return false;
    if (status !== null && item.status !== status) return false;
    if (mood !== null && item.mood !== mood) return false;
    if (pace !== null && item.pace !== pace) return false;
    if (tags.length > 0) {
      const movieTags = item.tags ?? [];
      if (!tags.some((tag) => movieTags.includes(tag))) return false;
    }
    return true;
  }) as Item[];
}
