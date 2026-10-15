import { type Kysely, sql } from "kysely";

const ITEM_TYPE_FIELDS_CHECK = sql`
  (
    rating IS NULL
    OR (rating >= 1 AND rating <= 5)
  )
  AND char_length(btrim(title)) > 0
  AND (
    CASE type::text
      WHEN 'shopping' THEN
        author IS NULL
        AND status IS NULL
        AND recommended_by IS NULL
        AND rating IS NULL
        AND notes IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
      WHEN 'book' THEN
        quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_read', 'reading', 'read'))
      WHEN 'movie' THEN
        author IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_watch', 'watched'))
      WHEN 'recipe' THEN
        author IS NULL
        AND status IS NULL
        AND recommended_by IS NULL
        AND rating IS NULL
        AND quantity IS NULL
        AND checked = false
      ELSE false
    END
  )
`;

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createType("item_type")
    .asEnum(["shopping", "book", "movie", "recipe"])
    .execute();

  await db.schema
    .createTable("items")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("type", sql`item_type`, (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("author", "text")
    .addColumn("status", "text")
    .addColumn("recommended_by", "text")
    .addColumn("rating", "smallint")
    .addColumn("notes", "text")
    .addColumn("quantity", "text")
    .addColumn("checked", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("ingredients", "jsonb")
    .addColumn("steps", "jsonb")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("items_pkey", ["user_id", "id"])
    .addCheckConstraint("items_type_fields", ITEM_TYPE_FIELDS_CHECK)
    .execute();

  await db.schema
    .createIndex("items_user_id_server_updated_at_idx")
    .on("items")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("items").execute();
  await db.schema.dropType("item_type").execute();
}
