import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("movie_quotes")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("movie_item_id", "uuid", (col) => col.notNull())
    .addColumn("text", "text", (col) => col.notNull())
    .addColumn("context", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("movie_quotes_pkey", ["user_id", "id"])
    .addForeignKeyConstraint("movie_quotes_movie_item_fk", ["user_id", "movie_item_id"], "items", [
      "user_id",
      "id",
    ])
    .addCheckConstraint(
      "movie_quotes_text_nonempty",
      sql`char_length(btrim(text)) > 0 AND char_length(btrim(text)) <= 4000`,
    )
    .addCheckConstraint(
      "movie_quotes_context_length",
      sql`context IS NULL OR char_length(btrim(context)) <= 500`,
    )
    .execute();

  await db.schema
    .createIndex("movie_quotes_user_movie_item_idx")
    .on("movie_quotes")
    .columns(["user_id", "movie_item_id"])
    .execute();

  await db.schema
    .createIndex("movie_quotes_user_server_updated_at_idx")
    .on("movie_quotes")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("movie_quotes").execute();
}
