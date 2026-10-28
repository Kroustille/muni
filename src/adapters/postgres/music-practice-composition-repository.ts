import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMusicPracticeCompositionRepository } from "@/application/ports/music-practice-composition-repository";
import {
  musicCompositionToWire,
  wireToMusicComposition,
  type MusicComposition,
  type MusicCompositionWire,
} from "@/domain/music-composition";
import type { DB, MusicComposition as MusicCompositionRow } from "./db-types";
import { toCalendarDate, toIso, toJsonArray, toJsonColumn } from "./music-practice-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toDomain(row: Selectable<MusicCompositionRow>): MusicComposition {
  return wireToMusicComposition({
    id: row.id,
    title: row.title,
    status: row.status as MusicCompositionWire["status"],
    started_at: row.started_at === null ? null : toCalendarDate(row.started_at),
    finished_at: row.finished_at === null ? null : toCalendarDate(row.finished_at),
    last_worked_at: row.last_worked_at === null ? null : toCalendarDate(row.last_worked_at),
    genre_style: row.genre_style,
    tempo_bpm: row.tempo_bpm,
    mood: row.mood,
    notes: row.notes,
    external_url: row.external_url,
    session_notes: toJsonArray(row.session_notes) as MusicCompositionWire["session_notes"],
    linked_track_ids: row.linked_track_ids as MusicCompositionWire["linked_track_ids"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as MusicCompositionWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: MusicCompositionWire,
  serverUpdatedAt: string,
): Insertable<MusicCompositionRow> {
  const entity = wireToMusicComposition(wire);
  return {
    user_id: userId,
    id: entity.id,
    title: entity.title,
    status: entity.status,
    started_at: entity.startedAt,
    finished_at: entity.finishedAt,
    last_worked_at: entity.lastWorkedAt,
    genre_style: entity.genreStyle,
    tempo_bpm: entity.tempoBpm,
    mood: entity.mood,
    notes: entity.notes,
    external_url: entity.externalUrl,
    session_notes: toJsonColumn(wire.session_notes),
    linked_track_ids: entity.linkedTrackIds,
    deleted_at: entity.deletedAt,
    fields_updated_at: toJsonColumn(wire.fields_updated_at),
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMusicPracticeCompositionRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("music_composition")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, composition) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = musicCompositionToWire(composition);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("music_composition")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            status: values.status,
            started_at: values.started_at,
            finished_at: values.finished_at,
            last_worked_at: values.last_worked_at,
            genre_style: values.genre_style,
            tempo_bpm: values.tempo_bpm,
            mood: values.mood,
            notes: values.notes,
            external_url: values.external_url,
            session_notes: values.session_notes,
            linked_track_ids: values.linked_track_ids,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToMusicComposition({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("music_composition")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);
      if (since !== null) query = query.where("server_updated_at", ">", since);
      return (await query.execute()).map(toDomain);
    },
  };
}

export function createPostgresMusicPracticeCompositionRepository(
  db: Kysely<DB>,
): ServerMusicPracticeCompositionRepository {
  return createRepo(db, false);
}
