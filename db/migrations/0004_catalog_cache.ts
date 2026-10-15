import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("catalog_cache")
    .addColumn("provider", "text", (col) => col.notNull())
    .addColumn("cache_key", "text", (col) => col.notNull())
    .addColumn("payload", "jsonb", (col) => col.notNull())
    .addColumn("fetched_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("catalog_cache_pkey", ["provider", "cache_key"])
    .execute();

  await db.schema
    .createIndex("catalog_cache_fetched_at_idx")
    .on("catalog_cache")
    .column("fetched_at")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("catalog_cache").execute();
}
