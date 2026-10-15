export type CatalogCacheProvider = "open_library";

export interface CatalogCacheRecord {
  provider: CatalogCacheProvider;
  cacheKey: string;
  payload: unknown;
  fetchedAt: Date;
}

export interface CatalogCacheRepository {
  /** Returns a fresh cached payload or null when missing or expired. */
  get(provider: CatalogCacheProvider, cacheKey: string, now: Date): Promise<unknown | null>;

  upsert(record: CatalogCacheRecord): Promise<void>;
}

export { CATALOG_CACHE_TTL_MS, isCatalogCacheFresh } from "../catalog-cache/ttl";
