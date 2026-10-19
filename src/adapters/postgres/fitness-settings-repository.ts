import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerFitnessSettingsRepository } from "@/application/ports/fitness-settings-repository";
import {
  fitnessUserSettingsToWire,
  wireToFitnessUserSettings,
  type FitnessUserSettings,
  type FitnessUserSettingsWire,
} from "@/domain/fitness/workout-log";
import type { DB, FitnessUserSettings as FitnessUserSettingsRow } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<FitnessUserSettingsRow>): FitnessUserSettings {
  return wireToFitnessUserSettings({
    id: row.id,
    charge_unit: row.charge_unit as FitnessUserSettingsWire["charge_unit"],
    adherence_tracking_enabled: row.adherence_tracking_enabled,
    adherence_min_workouts_per_week: row.adherence_min_workouts_per_week,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as FitnessUserSettingsWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: FitnessUserSettingsWire,
  serverUpdatedAt: string,
): Insertable<FitnessUserSettingsRow> {
  const settings = wireToFitnessUserSettings(wire);
  return {
    user_id: userId,
    id: settings.id,
    charge_unit: settings.chargeUnit,
    adherence_tracking_enabled: settings.adherenceTrackingEnabled,
    adherence_min_workouts_per_week: settings.adherenceMinWorkoutsPerWeek,
    deleted_at: settings.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerFitnessSettingsRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("fitness_user_settings")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, settings) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = fitnessUserSettingsToWire(settings);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("fitness_user_settings")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            charge_unit: values.charge_unit,
            adherence_tracking_enabled: values.adherence_tracking_enabled,
            adherence_min_workouts_per_week: values.adherence_min_workouts_per_week,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToFitnessUserSettings({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("fitness_user_settings")
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

export function createPostgresFitnessSettingsRepository(db: Kysely<DB>): ServerFitnessSettingsRepository {
  return createRepo(db, false);
}
