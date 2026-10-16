import type { Item } from "@/domain/item";

export type MovieTagFranchiseFilter = {
  tag?: string | null;
  franchiseName?: string | null;
};

export function collectLibraryTags(movies: readonly Item[]): string[] {
  const tags = new Set<string>();
  for (const item of movies) {
    if (item.type !== "movie" || item.tags === null) continue;
    for (const tag of item.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "fr"));
}

export function collectLibraryFranchiseNames(movies: readonly Item[]): string[] {
  const names = new Set<string>();
  for (const item of movies) {
    if (item.type !== "movie") continue;
    const name = item.franchiseName?.trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "fr"));
}

export function filterMoviesByTagOrFranchise(
  items: readonly Item[],
  filter: MovieTagFranchiseFilter,
): Item[] {
  const tag = filter.tag?.trim() || null;
  const franchiseName = filter.franchiseName?.trim() || null;
  if (tag === null && franchiseName === null) {
    return [...items];
  }

  return items.filter((item) => {
    if (item.type !== "movie") return false;
    if (tag !== null && !(item.tags?.includes(tag) ?? false)) return false;
    if (franchiseName !== null && item.franchiseName !== franchiseName) return false;
    return true;
  }) as Item[];
}
