import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerFitnessSessionTemplateRepository } from "@/application/ports/fitness-session-template-repository";
import {
  fitnessSessionTemplateToWire,
  wireToFitnessSessionTemplate,
  type FitnessSessionTemplate,
  type FitnessSessionTemplateWire,
} from "@/domain/fitness/session-template";
import type { DB, FitnessSessionTemplate as FitnessSessionTemplateRow } from "./db-types";
import { toJsonArray } from "./json-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<FitnessSessionTemplateRow>): FitnessSessionTemplate {
  return wireToFitnessSessionTemplate({
    id: row.id,
    title: row.title,
    sort_order: row.sort_order,
    template_exercises: toJsonArray(row.template_exercises) as FitnessSessionTemplateWire["template_exercises"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as FitnessSessionTemplateWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: FitnessSessionTemplateWire,
  serverUpdatedAt: string,
): Insertable<FitnessSessionTemplateRow> {
  const template = wireToFitnessSessionTemplate(wire);
  return {
    user_id: userId,
    id: template.id,
    title: template.title,
    sort_order: template.sortOrder,
    template_exercises: wire.template_exercises,
    deleted_at: template.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerFitnessSessionTemplateRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("fitness_session_template")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, template) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = fitnessSessionTemplateToWire(template);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("fitness_session_template")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            sort_order: values.sort_order,
            template_exercises: values.template_exercises,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToFitnessSessionTemplate({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("fitness_session_template")
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

export function createPostgresFitnessSessionTemplateRepository(
  db: Kysely<DB>,
): ServerFitnessSessionTemplateRepository {
  return createRepo(db, false);
}
