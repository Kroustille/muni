import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("reading_goals")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("year", "smallint", (col) => col.notNull())
    .addColumn("target_count", "integer", (col) => col.notNull())
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("reading_goals_pkey", ["user_id", "year"])
    .addCheckConstraint(
      "reading_goals_target_positive",
      sql`target_count >= 1 AND year >= 1900 AND year <= 2100`,
    )
    .execute();

  await db.schema
    .createIndex("reading_goals_user_server_updated_at_idx")
    .on("reading_goals")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("reading_goals").execute();
}
