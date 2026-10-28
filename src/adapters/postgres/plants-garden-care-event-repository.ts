import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerPlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import {
  plantCareEventToWire,
  wireToPlantCareEvent,
  type PlantCareEvent,
  type PlantCareEventWire,
} from "@/domain/plant-care-event";
import type { DB, PlantCareEvent as PlantCareEventRow } from "./db-types";

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

function toDomain(row: Selectable<PlantCareEventRow>): PlantCareEvent {
  return wireToPlantCareEvent({
    id: row.id,
    plant_id: row.plant_id,
    event_type: row.event_type as PlantCareEventWire["event_type"],
    occurred_at: toCalendarDate(row.occurred_at),
    notes: row.notes,
    seasonal_hint_id: row.seasonal_hint_id,
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as PlantCareEventWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: PlantCareEventWire,
  serverUpdatedAt: string,
): Insertable<PlantCareEventRow> {
  const event = wireToPlantCareEvent(wire);
  return {
    user_id: userId,
    id: event.id,
    plant_id: event.plantId,
    event_type: event.eventType,
    occurred_at: event.occurredAt,
    notes: event.notes,
    seasonal_hint_id: event.seasonalHintId,
    deleted_at: event.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerPlantsGardenCareEventRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) return fn(createRepo(db, true));
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom("plant_care_event")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async findWaterOnDay(userId, plantId, day, excludeId) {
      let query = db
        .selectFrom("plant_care_event")
        .selectAll()
        .where("user_id", "=", userId)
        .where("plant_id", "=", plantId)
        .where("event_type", "=", "water")
        .where("occurred_at", "=", day)
        .where("deleted_at", "is", null);
      if (excludeId !== undefined) {
        query = query.where("id", "!=", excludeId);
      }
      const row = await query.executeTakeFirst();
      return row === undefined ? undefined : toDomain(row);
    },

    async upsert(userId, event) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const wire = plantCareEventToWire(event);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("plant_care_event")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            plant_id: values.plant_id,
            event_type: values.event_type,
            occurred_at: values.occurred_at,
            notes: values.notes,
            seasonal_hint_id: values.seasonal_hint_id,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToPlantCareEvent({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("plant_care_event")
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

    async listInRange(userId, from, to) {
      const rows = await db
        .selectFrom("plant_care_event")
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

export function createPostgresPlantsGardenCareEventRepository(
  db: Kysely<DB>,
): ServerPlantsGardenCareEventRepository {
  return createRepo(db, false);
}
