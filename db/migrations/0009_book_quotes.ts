import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("book_quotes")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("book_item_id", "uuid", (col) => col.notNull())
    .addColumn("text", "text", (col) => col.notNull())
    .addColumn("page", "integer")
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("book_quotes_pkey", ["user_id", "id"])
    .addForeignKeyConstraint("book_quotes_book_item_fk", ["user_id", "book_item_id"], "items", [
      "user_id",
      "id",
    ])
    .addCheckConstraint(
      "book_quotes_text_nonempty",
      sql`char_length(btrim(text)) > 0 AND char_length(btrim(text)) <= 4000`,
    )
    .addCheckConstraint(
      "book_quotes_page_positive",
      sql`page IS NULL OR page >= 1`,
    )
    .execute();

  await db.schema
    .createIndex("book_quotes_user_book_item_idx")
    .on("book_quotes")
    .columns(["user_id", "book_item_id"])
    .execute();

  await db.schema
    .createIndex("book_quotes_user_server_updated_at_idx")
    .on("book_quotes")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("book_quotes").execute();
}
