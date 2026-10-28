import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMusicPracticeLearningPieceRepository } from "@/application/ports/music-practice-learning-piece-repository";
import {
  learningPieceToWire,
  wireToLearningPiece,
  type LearningPiece,
  type LearningPieceWire,
} from "@/domain/learning-piece";
import type { DB, LearningPiece as LearningPieceRow } from "./db-types";
import { toCalendarDate, toIso } from "./music-practice-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toDomain(row: Selectable<LearningPieceRow>): LearningPiece {
  return wireToLearningPiece({
    id: row.id,
    title: row.title,
    instrument_id: row.instrument_id,
    status: row.status as LearningPieceWire["status"],
    linked_track_id: row.linked_track_id,
    started_at: row.started_at === null ? null : toCalendarDate(row.started_at),
    last_practiced_at: row.last_practiced_at === null ? null : toCalendarDate(row.last_practiced_at),
    notes: row.notes,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as LearningPieceWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: LearningPieceWire,
  serverUpdatedAt: string,
): Insertable<LearningPieceRow> {
  const entity = wireToLearningPiece(wire);
  return {
    user_id: userId,
    id: entity.id,
    title: entity.title,
    instrument_id: entity.instrumentId,
    status: entity.status,
    linked_track_id: entity.linkedTrackId,
    started_at: entity.startedAt,
    last_practiced_at: entity.lastPracticedAt,
    notes: entity.notes,
    deleted_at: entity.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMusicPracticeLearningPieceRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("learning_piece")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, piece) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = learningPieceToWire(piece);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("learning_piece")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            instrument_id: values.instrument_id,
            status: values.status,
            linked_track_id: values.linked_track_id,
            started_at: values.started_at,
            last_practiced_at: values.last_practiced_at,
            notes: values.notes,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToLearningPiece({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("learning_piece")
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

export function createPostgresMusicPracticeLearningPieceRepository(
  db: Kysely<DB>,
): ServerMusicPracticeLearningPieceRepository {
  return createRepo(db, false);
}
