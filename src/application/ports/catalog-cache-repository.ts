export const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type CatalogCacheEntry = {
  provider: string;
  cacheKey: string;
  payload: unknown;
  fetchedAt: Date;
};

export function isCatalogCacheEntryFresh(
  fetchedAt: Date,
  now: Date,
  ttlMs: number = CATALOG_CACHE_TTL_MS,
): boolean {
  return now.getTime() - fetchedAt.getTime() < ttlMs;
}

export interface CatalogCacheRepository {
  get(provider: string, cacheKey: string, now?: Date): Promise<CatalogCacheEntry | null>;
  put(entry: CatalogCacheEntry): Promise<void>;
}
