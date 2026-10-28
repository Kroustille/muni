import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("cookbooks")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("author", "text")
    .addColumn("isbn", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("cookbooks_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "cookbooks_title_length",
      sql`char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 500`,
    )
    .addCheckConstraint(
      "cookbooks_author_length",
      sql`author IS NULL OR (char_length(btrim(author)) >= 1 AND char_length(btrim(author)) <= 200)`,
    )
    .addCheckConstraint(
      "cookbooks_isbn_length",
      sql`isbn IS NULL OR (char_length(btrim(isbn)) >= 1 AND char_length(btrim(isbn)) <= 32)`,
    )
    .execute();

  await db.schema
    .createIndex("cookbooks_user_server_updated_at_idx")
    .on("cookbooks")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .alterTable("items")
    .addColumn("cookbook_id", "uuid")
    .addColumn("source_page", "text")
    .execute();

  await db.schema
    .alterTable("items")
    .addForeignKeyConstraint("items_cookbook_fk", ["user_id", "cookbook_id"], "cookbooks", [
      "user_id",
      "id",
    ])
    .execute();

  await db.schema
    .alterTable("items")
    .addCheckConstraint(
      "items_recipe_source_fields",
      sql`
        (source_page IS NULL OR cookbook_id IS NOT NULL)
        AND (
          source_page IS NULL
          OR (
            char_length(btrim(source_page)) >= 1
            AND char_length(btrim(source_page)) <= 100
          )
        )
        AND (
          type::text = 'recipe'
          OR (cookbook_id IS NULL AND source_page IS NULL)
        )
      `,
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("items").dropConstraint("items_recipe_source_fields").execute();
  await db.schema.alterTable("items").dropConstraint("items_cookbook_fk").execute();
  await db.schema.alterTable("items").dropColumn("source_page").execute();
  await db.schema.alterTable("items").dropColumn("cookbook_id").execute();
  await db.schema.dropTable("cookbooks").execute();
}
