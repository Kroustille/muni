import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMusicPracticeLogRepository } from "@/application/ports/music-practice-log-repository";
import {
  practiceLogToWire,
  wireToPracticeLog,
  type PracticeLog,
  type PracticeLogWire,
} from "@/domain/practice-log";
import type { DB, PracticeLog as PracticeLogRow } from "./db-types";
import { toCalendarDate, toIso, toJsonColumn, toUuidArray } from "./music-practice-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toDomain(row: Selectable<PracticeLogRow>): PracticeLog {
  return wireToPracticeLog({
    id: row.id,
    practiced_at: toCalendarDate(row.practiced_at),
    practice_kind: row.practice_kind as PracticeLogWire["practice_kind"],
    instrument_id: row.instrument_id,
    exercise_ids: toUuidArray(row.exercise_ids),
    learning_piece_id: row.learning_piece_id,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as PracticeLogWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: PracticeLogWire,
  serverUpdatedAt: string,
): Insertable<PracticeLogRow> {
  const entity = wireToPracticeLog(wire);
  return {
    user_id: userId,
    id: entity.id,
    practiced_at: entity.practicedAt,
    practice_kind: entity.practiceKind,
    instrument_id: entity.instrumentId,
    exercise_ids: entity.exerciseIds,
    learning_piece_id: entity.learningPieceId,
    duration_minutes: entity.durationMinutes,
    notes: entity.notes,
    deleted_at: entity.deletedAt,
    fields_updated_at: toJsonColumn(wire.fields_updated_at),
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMusicPracticeLogRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("practice_log")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, log) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = practiceLogToWire(log);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("practice_log")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            practiced_at: values.practiced_at,
            practice_kind: values.practice_kind,
            instrument_id: values.instrument_id,
            exercise_ids: values.exercise_ids,
            learning_piece_id: values.learning_piece_id,
            duration_minutes: values.duration_minutes,
            notes: values.notes,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToPracticeLog({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("practice_log")
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

export function createPostgresMusicPracticeLogRepository(db: Kysely<DB>): ServerMusicPracticeLogRepository {
  return createRepo(db, false);
}
