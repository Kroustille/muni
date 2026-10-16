import type { Item } from "@/domain/item";

export type BookTagSeriesFilter = {
  tag?: string | null;
  seriesName?: string | null;
};

export function collectLibraryTags(books: readonly Item[]): string[] {
  const tags = new Set<string>();
  for (const item of books) {
    if (item.type !== "book" || item.tags === null) continue;
    for (const tag of item.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "fr"));
}

export function collectLibrarySeriesNames(books: readonly Item[]): string[] {
  const names = new Set<string>();
  for (const item of books) {
    if (item.type !== "book") continue;
    const name = item.seriesName?.trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "fr"));
}

export function filterBooksByTagOrSeries(
  items: readonly Item[],
  filter: BookTagSeriesFilter,
): Item[] {
  const tag = filter.tag?.trim() || null;
  const seriesName = filter.seriesName?.trim() || null;
  if (tag === null && seriesName === null) {
    return [...items];
  }

  return items.filter((item) => {
    if (item.type !== "book") return false;
    if (tag !== null && !(item.tags?.includes(tag) ?? false)) return false;
    if (seriesName !== null && item.seriesName !== seriesName) return false;
    return true;
  }) as Item[];
}
