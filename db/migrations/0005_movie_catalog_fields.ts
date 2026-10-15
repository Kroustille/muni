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
        AND imdb_id IS NULL
        AND release_year IS NULL
        AND catalog_rating IS NULL
        AND media_kind IS NULL
      WHEN 'book' THEN
        quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_read', 'reading', 'read'))
        AND (publication_year IS NULL OR (publication_year >= 1000 AND publication_year <= 2100))
        AND (page_count IS NULL OR page_count >= 1)
        AND imdb_id IS NULL
        AND release_year IS NULL
        AND catalog_rating IS NULL
        AND media_kind IS NULL
      WHEN 'movie' THEN
        author IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_watch', 'watched'))
        AND isbn IS NULL
        AND genres IS NULL
        AND publication_year IS NULL
        AND publisher IS NULL
        AND page_count IS NULL
        AND (release_year IS NULL OR (release_year >= 1000 AND release_year <= 2100))
        AND (catalog_rating IS NULL OR (catalog_rating >= 0 AND catalog_rating <= 10))
        AND (media_kind IS NULL OR media_kind IN ('film', 'series'))
        AND (imdb_id IS NULL OR imdb_id ~ '^tt[0-9]+$')
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
        AND imdb_id IS NULL
        AND release_year IS NULL
        AND catalog_rating IS NULL
        AND media_kind IS NULL
      ELSE false
    END
  )
`;

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("items")
    .addColumn("imdb_id", "text")
    .addColumn("release_year", "smallint")
    .addColumn("catalog_rating", sql`numeric(4,1)`)
    .addColumn("media_kind", "text")
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
    .dropColumn("media_kind")
    .dropColumn("catalog_rating")
    .dropColumn("release_year")
    .dropColumn("imdb_id")
    .execute();

  const PREVIOUS_CHECK = sql`
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
  await db.schema
    .alterTable("items")
    .addCheckConstraint("items_type_fields", PREVIOUS_CHECK)
    .execute();
}
