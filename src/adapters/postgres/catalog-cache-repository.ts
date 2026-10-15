import type { Kysely, Selectable } from "kysely";

import { isCatalogCacheFresh } from "../../application/catalog-cache/ttl";
import type {
  CatalogCacheRecord,
  CatalogCacheRepository,
} from "../../application/ports/catalog-cache-repository";
import type { CatalogCache, DB } from "./db-types";

export function createPostgresCatalogCacheRepository(db: Kysely<DB>): CatalogCacheRepository {
  return {
    async get(provider, cacheKey, now) {
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
      return row.payload;
    },

    async upsert(record: CatalogCacheRecord) {
      await db
        .insertInto("catalog_cache")
        .values({
          provider: record.provider,
          cache_key: record.cacheKey,
          payload: record.payload as Selectable<CatalogCache>["payload"],
          fetched_at: record.fetchedAt,
        })
        .onConflict((oc) =>
          oc.columns(["provider", "cache_key"]).doUpdateSet({
            payload: record.payload as Selectable<CatalogCache>["payload"],
            fetched_at: record.fetchedAt,
          }),
        )
        .execute();
    },
  };
}
