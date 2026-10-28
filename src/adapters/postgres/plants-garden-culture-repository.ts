import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerPlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import {
  vegetableCultureToWire,
  wireToVegetableCulture,
  type VegetableCulture,
  type VegetableCultureWire,
} from "@/domain/vegetable-culture";
import type { DB, VegetableCulture as VegetableCultureRow } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<VegetableCultureRow>): VegetableCulture {
  return wireToVegetableCulture({
    id: row.id,
    title: row.title,
    location_note: row.location_note,
    variety: row.variety,
    notes: row.notes,
    plant_id: row.plant_id,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as VegetableCultureWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: VegetableCultureWire,
  serverUpdatedAt: string,
): Insertable<VegetableCultureRow> {
  const culture = wireToVegetableCulture(wire);
  return {
    user_id: userId,
    id: culture.id,
    title: culture.title,
    location_note: culture.locationNote,
    variety: culture.variety,
    notes: culture.notes,
    plant_id: culture.plantId,
    deleted_at: culture.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerPlantsGardenCultureRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("vegetable_culture")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, culture) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = vegetableCultureToWire(culture);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("vegetable_culture")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            location_note: values.location_note,
            variety: values.variety,
            notes: values.notes,
            plant_id: values.plant_id,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToVegetableCulture({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("vegetable_culture")
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
  };
}

export function createPostgresPlantsGardenCultureRepository(
  db: Kysely<DB>,
): ServerPlantsGardenCultureRepository {
  return createRepo(db, false);
}
