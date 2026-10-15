/** Open Library catalog cache TTL (research.md §6, X4). */
export const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** True when `fetchedAt` is still within the catalog cache TTL at `now`. */
export function isCatalogCacheFresh(fetchedAt: Date, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() < CATALOG_CACHE_TTL_MS;
}
