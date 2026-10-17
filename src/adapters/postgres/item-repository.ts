import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerItemRepository } from "../../application/ports/server-item-repository";
import type { ItemWire } from "../../domain/item";
import type { DB, Items, Json } from "./db-types";

/** node-pg encodes JS arrays as PostgreSQL arrays; jsonb columns need JSON text. */
function toJsonbColumn(value: unknown): Json | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return JSON.stringify(value) as unknown as Json;
  }
  return value as Json;
}

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** PostgreSQL `date` columns round-trip as YYYY-MM-DD on ItemWire (same as domain validation). */
function toDateOnly(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function toWire(row: Selectable<Items>): ItemWire {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    created_at: toIso(row.created_at),
    author: row.author,
    status: row.status,
    recommended_by: row.recommended_by,
    rating: row.rating,
    notes: row.notes,
    quantity: row.quantity,
    checked: row.checked,
    ingredients: row.ingredients as ItemWire["ingredients"],
    steps: row.steps as ItemWire["steps"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as ItemWire["fields_updated_at"],
    isbn: row.isbn,
    synopsis: row.synopsis,
    genres: row.genres as ItemWire["genres"],
    publication_year: row.publication_year,
    publisher: row.publisher,
    page_count: row.page_count,
    work_id: row.work_id,
    tags: row.tags as ItemWire["tags"],
    series_name: row.series_name,
    series_position:
      row.series_position === null || row.series_position === undefined
        ? null
        : Number(row.series_position),
    pages_read: row.pages_read,
    loaned_to: row.loaned_to,
    loaned_at: row.loaned_at === null ? null : toDateOnly(row.loaned_at),
    mood: row.mood as ItemWire["mood"],
    pace: row.pace as ItemWire["pace"],
    franchise_id: row.franchise_id,
    franchise_name: row.franchise_name,
    franchise_order: row.franchise_order,
    watched_at: row.watched_at === null ? null : toDateOnly(row.watched_at),
    episode_progress: row.episode_progress as ItemWire["episode_progress"],
    next_episode_key: row.next_episode_key,
    streaming_providers: row.streaming_providers as ItemWire["streaming_providers"],
    director: row.director,
    cast: row.cast as ItemWire["cast"],
    imdb_id: row.imdb_id,
    release_year: row.release_year,
    catalog_rating:
      row.catalog_rating === null || row.catalog_rating === undefined
        ? null
        : Number(row.catalog_rating),
    media_kind: row.media_kind as ItemWire["media_kind"],
    artist: row.artist,
    album: row.album,
    music_brainz_artist_id: row.music_brainz_artist_id,
    music_brainz_recording_id: row.music_brainz_recording_id,
    spotify_url: row.spotify_url,
    soundcloud_url: row.soundcloud_url,
    server_updated_at: toIso(row.server_updated_at),
  };
}

function toRow(userId: string, wire: ItemWire): Insertable<Items> {
  if (wire.server_updated_at === null) {
    throw new Error("server_updated_at is required for upsert");
  }
  return {
    user_id: userId,
    id: wire.id,
    type: wire.type,
    title: wire.title,
    created_at: wire.created_at,
    author: wire.author,
    status: wire.status,
    recommended_by: wire.recommended_by,
    rating: wire.rating,
    notes: wire.notes,
    quantity: wire.quantity,
    checked: wire.checked,
    ingredients: toJsonbColumn(wire.ingredients),
    steps: toJsonbColumn(wire.steps),
    deleted_at: wire.deleted_at,
    fields_updated_at: toJsonbColumn(wire.fields_updated_at) as ItemWire["fields_updated_at"],
    isbn: wire.isbn ?? null,
    synopsis: wire.synopsis ?? null,
    genres: toJsonbColumn(wire.genres ?? null),
    publication_year: wire.publication_year ?? null,
    publisher: wire.publisher ?? null,
    page_count: wire.page_count ?? null,
    work_id: wire.work_id ?? null,
    tags: toJsonbColumn(wire.tags ?? null),
    series_name: wire.series_name ?? null,
    series_position:
      wire.series_position === null || wire.series_position === undefined
        ? null
        : String(wire.series_position),
    pages_read: wire.pages_read ?? null,
    loaned_to: wire.loaned_to ?? null,
    loaned_at: wire.loaned_at ?? null,
    mood: wire.mood ?? null,
    pace: wire.pace ?? null,
    franchise_id: wire.franchise_id ?? null,
    franchise_name: wire.franchise_name ?? null,
    franchise_order: wire.franchise_order ?? null,
    watched_at: wire.watched_at ?? null,
    episode_progress: toJsonbColumn(wire.episode_progress ?? null),
    next_episode_key: wire.next_episode_key ?? null,
    streaming_providers: toJsonbColumn(wire.streaming_providers ?? null),
    director: wire.director ?? null,
    cast: toJsonbColumn(wire.cast ?? null),
    imdb_id: wire.imdb_id ?? null,
    release_year: wire.release_year ?? null,
    catalog_rating: wire.catalog_rating ?? null,
    media_kind: wire.media_kind ?? null,
    artist: wire.artist ?? null,
    album: wire.album ?? null,
    music_brainz_artist_id: wire.music_brainz_artist_id ?? null,
    music_brainz_recording_id: wire.music_brainz_recording_id ?? null,
    spotify_url: wire.spotify_url ?? null,
    soundcloud_url: wire.soundcloud_url ?? null,
    server_updated_at: wire.server_updated_at,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerItemRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) {
        return fn(createRepo(db, true));
      }
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) {
        throw new Error("findByIds must run inside transaction");
      }
      if (ids.length === 0) return [];

      const rows = await db
        .selectFrom("items")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();

      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids
        .filter((id) => byId.has(id))
        .map((id) => toWire(byId.get(id)!));
    },

    async upsert(userId, rows) {
      for (const wire of rows) {
        const values = toRow(userId, wire);
        await db
          .insertInto("items")
          .values(values)
          .onConflict((oc) =>
            oc.columns(["user_id", "id"]).doUpdateSet({
              type: values.type,
              title: values.title,
              created_at: values.created_at,
              author: values.author,
              status: values.status,
              recommended_by: values.recommended_by,
              rating: values.rating,
              notes: values.notes,
              quantity: values.quantity,
              checked: values.checked,
              ingredients: values.ingredients,
              steps: values.steps,
              deleted_at: values.deleted_at,
              fields_updated_at: values.fields_updated_at,
              isbn: values.isbn,
              synopsis: values.synopsis,
              genres: values.genres,
              publication_year: values.publication_year,
              publisher: values.publisher,
              page_count: values.page_count,
              work_id: values.work_id,
              tags: values.tags,
              series_name: values.series_name,
              series_position: values.series_position,
              pages_read: values.pages_read,
              loaned_to: values.loaned_to,
              loaned_at: values.loaned_at,
              mood: values.mood,
              pace: values.pace,
              franchise_id: values.franchise_id,
              franchise_name: values.franchise_name,
              franchise_order: values.franchise_order,
              watched_at: values.watched_at,
              episode_progress: values.episode_progress,
              next_episode_key: values.next_episode_key,
              streaming_providers: values.streaming_providers,
              director: values.director,
              cast: values.cast,
              imdb_id: values.imdb_id,
              release_year: values.release_year,
              catalog_rating: values.catalog_rating,
              media_kind: values.media_kind,
              artist: values.artist,
              album: values.album,
              music_brainz_artist_id: values.music_brainz_artist_id,
              music_brainz_recording_id: values.music_brainz_recording_id,
              spotify_url: values.spotify_url,
              soundcloud_url: values.soundcloud_url,
              server_updated_at: values.server_updated_at,
            }),
          )
          .execute();
      }
    },

    async listSince(userId, since, limit) {
      let query = db
        .selectFrom("items")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);

      if (since !== null) {
        query = query.where("server_updated_at", ">", new Date(since));
      }

      const rows = await query.execute();
      return rows.map(toWire);
    },
  };
}

export function createPostgresItemRepository(db: Kysely<DB>): ServerItemRepository {
  return createRepo(db, false);
}
