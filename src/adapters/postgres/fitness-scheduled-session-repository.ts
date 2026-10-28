import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerFitnessScheduledSessionRepository } from "@/application/ports/fitness-scheduled-session-repository";
import {
  fitnessScheduledSessionToWire,
  wireToFitnessScheduledSession,
  type FitnessScheduledSession,
  type FitnessScheduledSessionWire,
} from "@/domain/fitness/scheduled-session";
import type { DB, FitnessScheduledSession as FitnessScheduledSessionRow } from "./db-types";

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

function toDomain(row: Selectable<FitnessScheduledSessionRow>): FitnessScheduledSession {
  return wireToFitnessScheduledSession({
    id: row.id,
    calendar_date: toCalendarDate(row.calendar_date),
    session_template_id: row.session_template_id,
    sort_order: row.sort_order,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as FitnessScheduledSessionWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: FitnessScheduledSessionWire,
  serverUpdatedAt: string,
): Insertable<FitnessScheduledSessionRow> {
  const row = wireToFitnessScheduledSession(wire);
  return {
    user_id: userId,
    id: row.id,
    calendar_date: row.calendarDate,
    session_template_id: row.sessionTemplateId,
    sort_order: row.sortOrder,
    deleted_at: row.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerFitnessScheduledSessionRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("fitness_scheduled_session")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, scheduled) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = fitnessScheduledSessionToWire(scheduled);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("fitness_scheduled_session")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            calendar_date: values.calendar_date,
            session_template_id: values.session_template_id,
            sort_order: values.sort_order,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToFitnessScheduledSession({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("fitness_scheduled_session")
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

export function createPostgresFitnessScheduledSessionRepository(
  db: Kysely<DB>,
): ServerFitnessScheduledSessionRepository {
  return createRepo(db, false);
}
