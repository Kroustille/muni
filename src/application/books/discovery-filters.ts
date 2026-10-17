import type { Item } from "@/domain/item";
import {
  filterItemsByDiscovery,
  isValidDiscoveryFilter,
  type DiscoveryFilter,
} from "@/application/shared/discovery-filters";

export type BookDiscoveryFilter = Omit<DiscoveryFilter, "mediaKind">;

export function isValidBookDiscoveryFilter(filter: BookDiscoveryFilter): boolean {
  return isValidDiscoveryFilter(filter);
}

export function filterBooksByDiscovery(
  items: readonly Item[],
  filter: BookDiscoveryFilter,
): Item[] {
  return filterItemsByDiscovery(items, filter, "book");
}
