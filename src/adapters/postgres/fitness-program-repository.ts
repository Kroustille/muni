import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerFitnessProgramRepository } from "@/application/ports/fitness-program-repository";
import {
  fitnessProgramToWire,
  wireToFitnessProgram,
  type FitnessProgram,
  type FitnessProgramWire,
} from "@/domain/fitness/program";
import type { DB, FitnessProgram as FitnessProgramRow } from "./db-types";
import { toJsonArray } from "./json-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<FitnessProgramRow>): FitnessProgram {
  return wireToFitnessProgram({
    id: row.id,
    name: row.name,
    is_active: row.is_active,
    planned_sessions: toJsonArray(row.planned_sessions) as FitnessProgramWire["planned_sessions"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as FitnessProgramWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: FitnessProgramWire,
  serverUpdatedAt: string,
): Insertable<FitnessProgramRow> {
  const program = wireToFitnessProgram(wire);
  return {
    user_id: userId,
    id: program.id,
    name: program.name,
    is_active: program.isActive,
    planned_sessions: wire.planned_sessions,
    deleted_at: program.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerFitnessProgramRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("fitness_program")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, program) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = fitnessProgramToWire(program);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("fitness_program")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            name: values.name,
            is_active: values.is_active,
            planned_sessions: values.planned_sessions,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToFitnessProgram({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("fitness_program")
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

export function createPostgresFitnessProgramRepository(db: Kysely<DB>): ServerFitnessProgramRepository {
  return createRepo(db, false);
}
