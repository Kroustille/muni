import { type Kysely, sql } from "kysely";

/** Same as 0006 except music_artist allows optional rating (1–5), matching domain FR-012. */
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
      WHEN 'music_artist' THEN
        author IS NULL
        AND status IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_recording_id IS NULL
        AND (music_brainz_artist_id IS NULL OR music_brainz_artist_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
        AND (spotify_url IS NULL OR spotify_url ~* '^https://')
        AND (soundcloud_url IS NULL OR soundcloud_url ~* '^https://')
      WHEN 'music_track' THEN
        author IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND isbn IS NULL
        AND synopsis IS NULL
        AND genres IS NULL
        AND publication_year IS NULL
        AND publisher IS NULL
        AND page_count IS NULL
        AND imdb_id IS NULL
        AND catalog_rating IS NULL
        AND media_kind IS NULL
        AND music_brainz_artist_id IS NULL
        AND char_length(btrim(artist)) > 0
        AND (status IS NULL OR status IN ('to_listen', 'listened'))
        AND (release_year IS NULL OR (release_year >= 1000 AND release_year <= 2100))
        AND (music_brainz_recording_id IS NULL OR music_brainz_recording_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
        AND (spotify_url IS NULL OR spotify_url ~* '^https://')
        AND (soundcloud_url IS NULL OR soundcloud_url ~* '^https://')
      ELSE false
    END
  )
`;

const PREVIOUS_CHECK_FROM_0006 = sql`
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL
      WHEN 'music_artist' THEN
        author IS NULL
        AND status IS NULL
        AND rating IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_recording_id IS NULL
        AND (music_brainz_artist_id IS NULL OR music_brainz_artist_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
        AND (spotify_url IS NULL OR spotify_url ~* '^https://')
        AND (soundcloud_url IS NULL OR soundcloud_url ~* '^https://')
      WHEN 'music_track' THEN
        author IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND isbn IS NULL
        AND synopsis IS NULL
        AND genres IS NULL
        AND publication_year IS NULL
        AND publisher IS NULL
        AND page_count IS NULL
        AND imdb_id IS NULL
        AND catalog_rating IS NULL
        AND media_kind IS NULL
        AND music_brainz_artist_id IS NULL
        AND char_length(btrim(artist)) > 0
        AND (status IS NULL OR status IN ('to_listen', 'listened'))
        AND (release_year IS NULL OR (release_year >= 1000 AND release_year <= 2100))
        AND (music_brainz_recording_id IS NULL OR music_brainz_recording_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
        AND (spotify_url IS NULL OR spotify_url ~* '^https://')
        AND (soundcloud_url IS NULL OR soundcloud_url ~* '^https://')
      ELSE false
    END
  )
`;

export async function up(db: Kysely<unknown>): Promise<void> {
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
    .addCheckConstraint("items_type_fields", PREVIOUS_CHECK_FROM_0006)
    .execute();
}
