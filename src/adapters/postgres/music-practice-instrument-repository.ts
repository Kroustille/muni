import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMusicPracticeInstrumentRepository } from "@/application/ports/music-practice-instrument-repository";
import {
  practiceInstrumentToWire,
  wireToPracticeInstrument,
  type PracticeInstrument,
  type PracticeInstrumentWire,
} from "@/domain/practice-instrument";
import type { DB, PracticeInstrument as PracticeInstrumentRow } from "./db-types";
import { toIso } from "./music-practice-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toDomain(row: Selectable<PracticeInstrumentRow>): PracticeInstrument {
  return wireToPracticeInstrument({
    id: row.id,
    name: row.name,
    notes: row.notes,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as PracticeInstrumentWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: PracticeInstrumentWire,
  serverUpdatedAt: string,
): Insertable<PracticeInstrumentRow> {
  const entity = wireToPracticeInstrument(wire);
  return {
    user_id: userId,
    id: entity.id,
    name: entity.name,
    notes: entity.notes,
    deleted_at: entity.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMusicPracticeInstrumentRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("practice_instrument")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, instrument) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = practiceInstrumentToWire(instrument);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("practice_instrument")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            name: values.name,
            notes: values.notes,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToPracticeInstrument({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("practice_instrument")
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

export function createPostgresMusicPracticeInstrumentRepository(
  db: Kysely<DB>,
): ServerMusicPracticeInstrumentRepository {
  return createRepo(db, false);
}
