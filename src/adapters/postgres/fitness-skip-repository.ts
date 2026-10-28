import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerFitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import {
  fitnessSkipRecordToWire,
  wireToFitnessSkipRecord,
  type FitnessSkipRecord,
  type FitnessSkipRecordWire,
} from "@/domain/fitness/workout-log";
import type { DB, FitnessSkipRecord as FitnessSkipRecordRow } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toCalendarDate(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function toDomain(row: Selectable<FitnessSkipRecordRow>): FitnessSkipRecord {
  return wireToFitnessSkipRecord({
    id: row.id,
    calendar_date: toCalendarDate(row.calendar_date),
    scheduled_session_id: row.scheduled_session_id,
    session_template_id: row.session_template_id,
    title_snapshot: row.title_snapshot,
    note: row.note,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as FitnessSkipRecordWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: FitnessSkipRecordWire,
  serverUpdatedAt: string,
): Insertable<FitnessSkipRecordRow> {
  const record = wireToFitnessSkipRecord(wire);
  return {
    user_id: userId,
    id: record.id,
    calendar_date: record.calendarDate,
    scheduled_session_id: record.scheduledSessionId,
    session_template_id: record.sessionTemplateId,
    title_snapshot: record.titleSnapshot,
    note: record.note,
    deleted_at: record.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerFitnessSkipRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("fitness_skip_record")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, record) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = fitnessSkipRecordToWire(record);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(
        userId,
        { ...wire, server_updated_at: serverUpdatedAt },
        serverUpdatedAt,
      );
      await db
        .insertInto("fitness_skip_record")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            calendar_date: values.calendar_date,
            scheduled_session_id: values.scheduled_session_id,
            session_template_id: values.session_template_id,
            title_snapshot: values.title_snapshot,
            note: values.note,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToFitnessSkipRecord({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("fitness_skip_record")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);
      if (since !== null) {
        query = query.where("server_updated_at", ">", since);
      }
      const rows = await query.execute();
      return rows.map(toDomain);
    },
  };
}

export function createPostgresFitnessSkipRepository(db: Kysely<DB>): ServerFitnessSkipRepository {
  return createRepo(db, false);
}
