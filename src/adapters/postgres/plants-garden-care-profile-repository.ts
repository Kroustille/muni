import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerPlantsGardenCareProfileRepository } from "@/application/ports/plants-garden-care-profile-repository";
import {
  plantCareProfileToWire,
  wireToPlantCareProfile,
  type PlantCareProfile,
  type PlantCareProfileWire,
} from "@/domain/plant-care-profile";
import type { DB, PlantCareProfile as PlantCareProfileRow } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<PlantCareProfileRow>): PlantCareProfile {
  return wireToPlantCareProfile({
    id: row.id,
    title: row.title,
    seasonal_hints: Array.isArray(row.seasonal_hints) ? (row.seasonal_hints as PlantCareProfileWire["seasonal_hints"]) : [],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as PlantCareProfileWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: PlantCareProfileWire,
  serverUpdatedAt: string,
): Insertable<PlantCareProfileRow> {
  const profile = wireToPlantCareProfile(wire);
  return {
    user_id: userId,
    id: profile.id,
    title: profile.title,
    seasonal_hints: wire.seasonal_hints,
    deleted_at: profile.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerPlantsGardenCareProfileRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("plant_care_profile")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, profile) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = plantCareProfileToWire(profile);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("plant_care_profile")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            seasonal_hints: values.seasonal_hints,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToPlantCareProfile({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("plant_care_profile")
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

export function createPostgresPlantsGardenCareProfileRepository(
  db: Kysely<DB>,
): ServerPlantsGardenCareProfileRepository {
  return createRepo(db, false);
}
