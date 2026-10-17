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
        AND artist IS NULL
        AND album IS NULL
        AND music_brainz_artist_id IS NULL
        AND music_brainz_recording_id IS NULL
        AND spotify_url IS NULL
        AND soundcloud_url IS NULL

        AND franchise_id IS NULL
        AND franchise_name IS NULL
        AND franchise_order IS NULL
        AND watched_at IS NULL
        AND episode_progress IS NULL
        AND next_episode_key IS NULL
        AND streaming_providers IS NULL
        AND director IS NULL
        AND cast IS NULL
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
      WHEN 'book' THEN
        quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_read', 'reading', 'read', 'paused'))
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
        AND franchise_id IS NULL
        AND franchise_name IS NULL
        AND franchise_order IS NULL
        AND watched_at IS NULL
        AND episode_progress IS NULL
        AND next_episode_key IS NULL
        AND streaming_providers IS NULL
        AND director IS NULL
        AND cast IS NULL
        AND (pages_read IS NULL OR pages_read >= 0)
        AND (loaned_at IS NULL OR loaned_to IS NOT NULL)
      WHEN 'movie' THEN
        author IS NULL
        AND quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_watch', 'watched', 'paused', 'in_progress'))
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
        AND work_id IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
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
      

        AND franchise_id IS NULL
        AND franchise_name IS NULL
        AND franchise_order IS NULL
        AND watched_at IS NULL
        AND episode_progress IS NULL
        AND next_episode_key IS NULL
        AND streaming_providers IS NULL
        AND director IS NULL
        AND cast IS NULL
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
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
      

        AND franchise_id IS NULL
        AND franchise_name IS NULL
        AND franchise_order IS NULL
        AND watched_at IS NULL
        AND episode_progress IS NULL
        AND next_episode_key IS NULL
        AND streaming_providers IS NULL
        AND director IS NULL
        AND cast IS NULL
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
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
      

        AND franchise_id IS NULL
        AND franchise_name IS NULL
        AND franchise_order IS NULL
        AND watched_at IS NULL
        AND episode_progress IS NULL
        AND next_episode_key IS NULL
        AND streaming_providers IS NULL
        AND director IS NULL
        AND cast IS NULL
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
      ELSE false
    END
  )


`;

const PREVIOUS_CHECK_FROM_0008 = sql`

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
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
      WHEN 'book' THEN
        quantity IS NULL
        AND ingredients IS NULL
        AND steps IS NULL
        AND checked = false
        AND (status IS NULL OR status IN ('to_read', 'reading', 'read', 'paused'))
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
      
        AND (pages_read IS NULL OR pages_read >= 0)
        AND (loaned_at IS NULL OR loaned_to IS NOT NULL)
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
      
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
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
      
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
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
      
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
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
      
        AND work_id IS NULL
        AND tags IS NULL
        AND series_name IS NULL
        AND series_position IS NULL
        AND pages_read IS NULL
        AND loaned_to IS NULL
        AND loaned_at IS NULL
        AND mood IS NULL
        AND pace IS NULL
      ELSE false
    END
  )


`;

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("items")
    .addColumn("franchise_id", "text")
    .addColumn("franchise_name", "text")
    .addColumn("franchise_order", "smallint")
    .addColumn("watched_at", "date")
    .addColumn("episode_progress", "jsonb")
    .addColumn("next_episode_key", "text")
    .addColumn("streaming_providers", "jsonb")
    .addColumn("director", "text")
    .addColumn("cast", "jsonb")
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
    .addCheckConstraint("items_type_fields", PREVIOUS_CHECK_FROM_0008)
    .execute();

  await db.schema
    .alterTable("items")
    .dropColumn("cast")
    .dropColumn("director")
    .dropColumn("streaming_providers")
    .dropColumn("next_episode_key")
    .dropColumn("episode_progress")
    .dropColumn("watched_at")
    .dropColumn("franchise_order")
    .dropColumn("franchise_name")
    .dropColumn("franchise_id")
    .execute();
}
