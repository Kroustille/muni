import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerPlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";
import {
  vegetableMilestoneToWire,
  wireToVegetableMilestone,
  type VegetableMilestone,
  type VegetableMilestoneWire,
} from "@/domain/vegetable-milestone";
import type { DB, VegetableMilestone as VegetableMilestoneRow } from "./db-types";

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

function toDomain(row: Selectable<VegetableMilestoneRow>): VegetableMilestone {
  return wireToVegetableMilestone({
    id: row.id,
    culture_id: row.culture_id,
    milestone_type: row.milestone_type as VegetableMilestoneWire["milestone_type"],
    occurred_at: toCalendarDate(row.occurred_at),
    notes: row.notes,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as VegetableMilestoneWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: VegetableMilestoneWire,
  serverUpdatedAt: string,
): Insertable<VegetableMilestoneRow> {
  const milestone = wireToVegetableMilestone(wire);
  return {
    user_id: userId,
    id: milestone.id,
    culture_id: milestone.cultureId,
    milestone_type: milestone.milestoneType,
    occurred_at: milestone.occurredAt,
    notes: milestone.notes,
    deleted_at: milestone.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerPlantsGardenMilestoneRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("vegetable_milestone")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async findOnDay(userId, cultureId, milestoneType, day, excludeId) {
      let query = db
        .selectFrom("vegetable_milestone")
        .selectAll()
        .where("user_id", "=", userId)
        .where("culture_id", "=", cultureId)
        .where("milestone_type", "=", milestoneType)
        .where("occurred_at", "=", day)
        .where("deleted_at", "is", null);
      if (excludeId !== undefined) {
        query = query.where("id", "!=", excludeId);
      }
      const row = await query.executeTakeFirst();
      return row === undefined ? undefined : toDomain(row);
    },

    async upsert(userId, milestone) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = vegetableMilestoneToWire(milestone);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("vegetable_milestone")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            culture_id: values.culture_id,
            milestone_type: values.milestone_type,
            occurred_at: values.occurred_at,
            notes: values.notes,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToVegetableMilestone({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("vegetable_milestone")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);
      if (since !== null) {
        query = query.where("server_updated_at", ">", since);
      }
      return (await query.execute()).map(toDomain);
    },

    async listInRange(userId, from, to) {
      const rows = await db
        .selectFrom("vegetable_milestone")
        .selectAll()
        .where("user_id", "=", userId)
        .where("occurred_at", ">=", from)
        .where("occurred_at", "<=", to)
        .where("deleted_at", "is", null)
        .execute();
      return rows.map(toDomain);
    },
  };
}

export function createPostgresPlantsGardenMilestoneRepository(
  db: Kysely<DB>,
): ServerPlantsGardenMilestoneRepository {
  return createRepo(db, false);
}
