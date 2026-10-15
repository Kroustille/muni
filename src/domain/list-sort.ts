import type { Item, ItemType } from "./item";

export const LIST_SORT_FIELDS = ["date", "rating"] as const;
export const LIST_SORT_ORDERS = ["asc", "desc"] as const;

export type ListSortField = (typeof LIST_SORT_FIELDS)[number];
export type ListSortOrder = (typeof LIST_SORT_ORDERS)[number];

export type ListSort = {
  field: ListSortField;
  order: ListSortOrder;
};

export const DEFAULT_LIST_SORT: ListSort = { field: "date", order: "desc" };

export function itemTypeSupportsRatingSort(type: ItemType): boolean {
  return type === "book" || type === "movie" || type === "music_track";
}

function compareByDate(a: Item, b: Item, order: ListSortOrder): number {
  const cmp = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  return order === "asc" ? cmp : -cmp;
}

function compareByRating(a: Item, b: Item, order: ListSortOrder): number {
  const aUnrated = a.rating === null;
  const bUnrated = b.rating === null;
  if (aUnrated && bUnrated) return compareByDate(a, b, "desc");
  if (aUnrated) return 1;
  if (bUnrated) return -1;
  const cmp = a.rating! - b.rating!;
  if (cmp !== 0) return order === "asc" ? cmp : -cmp;
  return compareByDate(a, b, "desc");
}

export function compareItemsForList(a: Item, b: Item, sort: ListSort): number {
  if (sort.field === "rating") {
    return compareByRating(a, b, sort.order);
  }
  return compareByDate(a, b, sort.order);
}

export function sortItemsForList(items: Item[], sort: ListSort): Item[] {
  return [...items].sort((a, b) => compareItemsForList(a, b, sort));
}

export function normalizeListSort(sort: ListSort, allowRatingField: boolean): ListSort {
  if (!allowRatingField && sort.field === "rating") {
    return DEFAULT_LIST_SORT;
  }
  return sort;
}
