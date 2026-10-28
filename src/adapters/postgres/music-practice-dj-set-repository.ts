import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMusicPracticeDjSetRepository } from "@/application/ports/music-practice-dj-set-repository";
import { djSetToWire, wireToDjSet, type DjSet, type DjSetWire } from "@/domain/dj-set";
import type { DB, DjSet as DjSetRow } from "./db-types";
import { toCalendarDate, toIso, toJsonArray, toJsonColumn } from "./music-practice-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toDomain(row: Selectable<DjSetRow>): DjSet {
  return wireToDjSet({
    id: row.id,
    title: row.title,
    status: row.status as DjSetWire["status"],
    performed_at: row.performed_at === null ? null : toCalendarDate(row.performed_at),
    venue: row.venue,
    duration_minutes: row.duration_minutes,
    genre_style: row.genre_style,
    bpm_range: row.bpm_range,
    mood: row.mood,
    notes: row.notes,
    setlist: toJsonArray(row.setlist) as DjSetWire["setlist"],
    external_url: row.external_url,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as DjSetWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(userId: string, wire: DjSetWire, serverUpdatedAt: string): Insertable<DjSetRow> {
  const entity = wireToDjSet(wire);
  return {
    user_id: userId,
    id: entity.id,
    title: entity.title,
    status: entity.status,
    performed_at: entity.performedAt,
    venue: entity.venue,
    duration_minutes: entity.durationMinutes,
    genre_style: entity.genreStyle,
    bpm_range: entity.bpmRange,
    mood: entity.mood,
    notes: entity.notes,
    setlist: toJsonColumn(wire.setlist ?? []),
    external_url: entity.externalUrl,
    deleted_at: entity.deletedAt,
    fields_updated_at: toJsonColumn(wire.fields_updated_at),
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMusicPracticeDjSetRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("dj_set")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, djSet) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = djSetToWire(djSet);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("dj_set")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            status: values.status,
            performed_at: values.performed_at,
            venue: values.venue,
            duration_minutes: values.duration_minutes,
            genre_style: values.genre_style,
            bpm_range: values.bpm_range,
            mood: values.mood,
            notes: values.notes,
            setlist: values.setlist,
            external_url: values.external_url,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToDjSet({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("dj_set")
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

export function createPostgresMusicPracticeDjSetRepository(db: Kysely<DB>): ServerMusicPracticeDjSetRepository {
  return createRepo(db, false);
}
