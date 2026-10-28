import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMusicPracticePlanRepository } from "@/application/ports/music-practice-plan-repository";
import {
  practicePlanToWire,
  wireToPracticePlan,
  type PracticePlan,
  type PracticePlanWire,
} from "@/domain/practice-plan";
import type { DB, PracticePlan as PracticePlanRow } from "./db-types";
import { toIso, toJsonArray, toJsonColumn } from "./music-practice-row-utils";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toDomain(row: Selectable<PracticePlanRow>): PracticePlan {
  return wireToPracticePlan({
    id: row.id,
    name: row.name,
    is_active: row.is_active,
    assignments: toJsonArray(row.assignments) as PracticePlanWire["assignments"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as PracticePlanWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: PracticePlanWire,
  serverUpdatedAt: string,
): Insertable<PracticePlanRow> {
  const entity = wireToPracticePlan(wire);
  return {
    user_id: userId,
    id: entity.id,
    name: entity.name,
    is_active: entity.isActive,
    assignments: toJsonColumn(wire.assignments),
    deleted_at: entity.deletedAt,
    fields_updated_at: toJsonColumn(wire.fields_updated_at),
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMusicPracticePlanRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("practice_plan")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, plan) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = practicePlanToWire(plan);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("practice_plan")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            name: values.name,
            is_active: values.is_active,
            assignments: values.assignments,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToPracticePlan({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("practice_plan")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);
      if (since !== null) query = query.where("server_updated_at", ">", since);
      return (await query.execute()).map(toDomain);
    },

    async listActive(userId) {
      const rows = await db
        .selectFrom("practice_plan")
        .selectAll()
        .where("user_id", "=", userId)
        .where("is_active", "=", true)
        .where("deleted_at", "is", null)
        .execute();
      return rows.map(toDomain);
    },

    async demoteOtherActivePlans(userId, exceptId) {
      if (!inTransaction) throw new Error("demoteOtherActivePlans must run inside transaction");
      const serverUpdatedAt = new Date().toISOString();
      await db
        .updateTable("practice_plan")
        .set({ is_active: false, server_updated_at: serverUpdatedAt })
        .where("user_id", "=", userId)
        .where("is_active", "=", true)
        .where("id", "!=", exceptId)
        .where("deleted_at", "is", null)
        .execute();
    },
  };
}

export function createPostgresMusicPracticePlanRepository(db: Kysely<DB>): ServerMusicPracticePlanRepository {
  return createRepo(db, false);
}
