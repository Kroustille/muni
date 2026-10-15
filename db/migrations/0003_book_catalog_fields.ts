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
        AND isbn IS NULL
        AND synopsis IS NULL
        AND genres IS NULL
        AND publication_year IS NULL
        AND publisher IS NULL
        AND page_count IS NULL
      WHEN 'book' THEN
        quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_read', 'reading', 'read'))
        AND (publication_year IS NULL OR (publication_year >= 1000 AND publication_year <= 2100))
        AND (page_count IS NULL OR page_count >= 1)
      WHEN 'movie' THEN
        author IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_watch', 'watched'))
        AND isbn IS NULL
        AND synopsis IS NULL
        AND genres IS NULL
        AND publication_year IS NULL
        AND publisher IS NULL
        AND page_count IS NULL
      WHEN 'recipe' THEN
        author IS NULL
        AND status IS NULL
        AND recommended_by IS NULL
        AND rating IS NULL
        AND quantity IS NULL
        AND checked = false
        AND isbn IS NULL
        AND synopsis IS NULL
        AND genres IS NULL
        AND publication_year IS NULL
        AND publisher IS NULL
        AND page_count IS NULL
      ELSE false
    END
  )
`;

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("items")
    .addColumn("isbn", "text")
    .addColumn("synopsis", "text")
    .addColumn("genres", "jsonb")
    .addColumn("publication_year", "smallint")
    .addColumn("publisher", "text")
    .addColumn("page_count", "integer")
    .execute();

  await db.schema.alterTable("items").dropConstraint("items_type_fields").execute();
  await db.schema
    .alterTable("items")
    .addCheckConstraint("items_type_fields", ITEM_TYPE_FIELDS_CHECK)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("items").dropConstraint("items_type_fields").execute();
  await db.schema
    .alterTable("items")
    .dropColumn("page_count")
    .dropColumn("publisher")
    .dropColumn("publication_year")
    .dropColumn("genres")
    .dropColumn("synopsis")
    .dropColumn("isbn")
    .execute();

  const LEGACY_CHECK = sql`
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
  await db.schema
    .alterTable("items")
    .addCheckConstraint("items_type_fields", LEGACY_CHECK)
    .execute();
}
