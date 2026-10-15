import { isCatalogCacheFresh } from "@/application/catalog-cache/ttl";
import type {
  CatalogCacheProvider,
  CatalogCacheRecord,
  CatalogCacheRepository,
} from "@/application/ports/catalog-cache-repository";

export class InMemoryCatalogCacheRepository implements CatalogCacheRepository {
  private readonly rows = new Map<string, CatalogCacheRecord>();

  private key(provider: CatalogCacheProvider, cacheKey: string): string {
    return `${provider}\0${cacheKey}`;
  }

  async get(
    provider: CatalogCacheProvider,
    cacheKey: string,
    now: Date,
  ): Promise<unknown | null> {
    const row = this.rows.get(this.key(provider, cacheKey));
    if (!row || !isCatalogCacheFresh(row.fetchedAt, now)) {
      return null;
    }
    return row.payload;
  }

  async upsert(record: CatalogCacheRecord): Promise<void> {
    this.rows.set(this.key(record.provider, record.cacheKey), { ...record });
  }
}
