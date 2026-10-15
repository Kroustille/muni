import type { Item, ItemType } from "./item";

export const LIST_SORT_MODES = ["newest", "rating"] as const;
export type ListSortMode = (typeof LIST_SORT_MODES)[number];

export function itemTypeSupportsRatingSort(type: ItemType): boolean {
  return type === "book" || type === "movie" || type === "music_track";
}

function byNewest(a: Item, b: Item): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

export function compareItemsForList(a: Item, b: Item, sort: ListSortMode): number {
  if (sort === "rating") {
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    if (ratingA !== ratingB) return ratingB - ratingA;
  }
  return byNewest(a, b);
}

export function sortItemsForList(items: Item[], sort: ListSortMode): Item[] {
  return [...items].sort((a, b) => compareItemsForList(a, b, sort));
}
