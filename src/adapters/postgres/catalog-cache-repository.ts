import type { Kysely, Selectable } from "kysely";

import { isCatalogCacheFresh } from "../../application/ports/catalog-cache-ttl";
import type {
  CatalogCacheProvider,
  CatalogCacheRecord,
  CatalogCacheRepository,
} from "../../application/ports/catalog-cache-repository";
import type { CatalogCache, DB, Json } from "./db-types";

function rowPayload(row: Selectable<CatalogCache>): unknown {
  return row.payload;
}

export function createPostgresCatalogCacheRepository(db: Kysely<DB>): CatalogCacheRepository {
  return {
    async get(provider: CatalogCacheProvider, cacheKey: string, now: Date) {
      const row = await db
        .selectFrom("catalog_cache")
        .selectAll()
        .where("provider", "=", provider)
        .where("cache_key", "=", cacheKey)
        .executeTakeFirst();
      if (!row) return null;
      const fetchedAt = new Date(row.fetched_at);
      if (!isCatalogCacheFresh(fetchedAt, now)) {
        return null;
      }
      return rowPayload(row);
    },

    async upsert(record: CatalogCacheRecord) {
      await db
        .insertInto("catalog_cache")
        .values({
          provider: record.provider,
          cache_key: record.cacheKey,
          payload: record.payload as Json,
          fetched_at: record.fetchedAt,
        })
        .onConflict((oc) =>
          oc.columns(["provider", "cache_key"]).doUpdateSet({
            payload: record.payload as Json,
            fetched_at: record.fetchedAt,
          }),
        )
        .execute();
    },
  };
}
