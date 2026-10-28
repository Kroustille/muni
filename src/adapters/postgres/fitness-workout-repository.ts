import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerFitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import {
  fitnessWorkoutLogToWire,
  wireToFitnessWorkoutLog,
  type FitnessWorkoutLog,
  type FitnessWorkoutLogWire,
} from "@/domain/fitness/workout-log";
import type { DB, FitnessWorkoutLog as FitnessWorkoutLogRow } from "./db-types";

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

function toDomain(row: Selectable<FitnessWorkoutLogRow>): FitnessWorkoutLog {
  return wireToFitnessWorkoutLog({
    id: row.id,
    status: row.status as FitnessWorkoutLogWire["status"],
    calendar_date: toCalendarDate(row.calendar_date),
    session_template_id: row.session_template_id,
    scheduled_session_id: row.scheduled_session_id,
    title: row.title,
    started_at: toIso(row.started_at),
    completed_at: row.completed_at === null ? null : toIso(row.completed_at),
    catalog_version: row.catalog_version,
    logged_exercises: row.logged_exercises as FitnessWorkoutLogWire["logged_exercises"],
    recovery: row.recovery as FitnessWorkoutLogWire["recovery"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as FitnessWorkoutLogWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: FitnessWorkoutLogWire,
  serverUpdatedAt: string,
): Insertable<FitnessWorkoutLogRow> {
  const log = wireToFitnessWorkoutLog(wire);
  return {
    user_id: userId,
    id: log.id,
    status: log.status,
    calendar_date: log.calendarDate,
    session_template_id: log.sessionTemplateId,
    scheduled_session_id: log.scheduledSessionId,
    title: log.title,
    started_at: log.startedAt,
    completed_at: log.completedAt,
    catalog_version: log.catalogVersion,
    logged_exercises: wire.logged_exercises,
    recovery: wire.recovery,
    deleted_at: log.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerFitnessWorkoutRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("fitness_workout_log")
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
      const wire = fitnessWorkoutLogToWire(log);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("fitness_workout_log")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            status: values.status,
            calendar_date: values.calendar_date,
            session_template_id: values.session_template_id,
            scheduled_session_id: values.scheduled_session_id,
            title: values.title,
            started_at: values.started_at,
            completed_at: values.completed_at,
            catalog_version: values.catalog_version,
            logged_exercises: values.logged_exercises,
            recovery: values.recovery,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToFitnessWorkoutLog({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("fitness_workout_log")
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

export function createPostgresFitnessWorkoutRepository(db: Kysely<DB>): ServerFitnessWorkoutRepository {
  return createRepo(db, false);
}
