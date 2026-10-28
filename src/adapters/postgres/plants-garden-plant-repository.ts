import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerPlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import { plantToWire, wireToPlant, type Plant, type PlantWire } from "@/domain/plant";
import type { DB, Plant as PlantRow } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toDomain(row: Selectable<PlantRow>): Plant {
  return wireToPlant({
    id: row.id,
    title: row.title,
    location_tag: row.location_tag as PlantWire["location_tag"],
    notes: row.notes,
    care_profile_id: row.care_profile_id,
    seasonal_hints: normalizeJsonArray(row.seasonal_hints),
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as PlantWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(userId: string, wire: PlantWire, serverUpdatedAt: string): Insertable<PlantRow> {
  const plant = wireToPlant(wire);
  return {
    user_id: userId,
    id: plant.id,
    title: plant.title,
    location_tag: plant.locationTag,
    notes: plant.notes,
    care_profile_id: plant.careProfileId,
    seasonal_hints: wire.seasonal_hints,
    deleted_at: plant.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerPlantsGardenPlantRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("plant")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, plant) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = plantToWire(plant);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("plant")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            location_tag: values.location_tag,
            notes: values.notes,
            care_profile_id: values.care_profile_id,
            seasonal_hints: values.seasonal_hints,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToPlant({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("plant")
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

export function createPostgresPlantsGardenPlantRepository(db: Kysely<DB>): ServerPlantsGardenPlantRepository {
  return createRepo(db, false);
}
