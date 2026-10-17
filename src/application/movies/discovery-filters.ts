import type { Item } from "@/domain/item";
import {
  filterItemsByDiscovery,
  isValidDiscoveryFilter,
  type DiscoveryFilter,
} from "@/application/shared/discovery-filters";

export type MovieDiscoveryFilter = DiscoveryFilter;

export function isValidMovieDiscoveryFilter(filter: MovieDiscoveryFilter): boolean {
  return isValidDiscoveryFilter(filter);
}

export function filterMoviesByDiscovery(
  items: readonly Item[],
  filter: MovieDiscoveryFilter,
): Item[] {
  return filterItemsByDiscovery(items, filter, "movie");
}
