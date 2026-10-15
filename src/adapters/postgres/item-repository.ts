import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerItemRepository } from "../../application/ports/server-item-repository";
import type { ItemWire } from "../../domain/item";
import type { DB, Items } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toWire(row: Selectable<Items>): ItemWire {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    created_at: toIso(row.created_at),
    author: row.author,
    status: row.status,
    recommended_by: row.recommended_by,
    rating: row.rating,
    notes: row.notes,
    quantity: row.quantity,
    checked: row.checked,
    ingredients: row.ingredients as ItemWire["ingredients"],
    steps: row.steps as ItemWire["steps"],
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as ItemWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  };
}

function toRow(userId: string, wire: ItemWire): Insertable<Items> {
  if (wire.server_updated_at === null) {
    throw new Error("server_updated_at is required for upsert");
  }
  return {
    user_id: userId,
    id: wire.id,
    type: wire.type,
    title: wire.title,
    created_at: wire.created_at,
    author: wire.author,
    status: wire.status,
    recommended_by: wire.recommended_by,
    rating: wire.rating,
    notes: wire.notes,
    quantity: wire.quantity,
    checked: wire.checked,
    ingredients: wire.ingredients,
    steps: wire.steps,
    deleted_at: wire.deleted_at,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: wire.server_updated_at,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerItemRepository {
  return {
    transaction: (fn) => {
      if (inTransaction) {
        return fn(createRepo(db, true));
      }
      return db.transaction().execute(async (trx) => fn(createRepo(trx, true)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) {
        throw new Error("findByIds must run inside transaction");
      }
      if (ids.length === 0) return [];

      const rows = await db
        .selectFrom("items")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();

      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids
        .filter((id) => byId.has(id))
        .map((id) => toWire(byId.get(id)!));
    },

    async upsert(userId, rows) {
      for (const wire of rows) {
        const values = toRow(userId, wire);
        await db
          .insertInto("items")
          .values(values)
          .onConflict((oc) =>
            oc.columns(["user_id", "id"]).doUpdateSet({
              type: values.type,
              title: values.title,
              created_at: values.created_at,
              author: values.author,
              status: values.status,
              recommended_by: values.recommended_by,
              rating: values.rating,
              notes: values.notes,
              quantity: values.quantity,
              checked: values.checked,
              ingredients: values.ingredients,
              steps: values.steps,
              deleted_at: values.deleted_at,
              fields_updated_at: values.fields_updated_at,
              server_updated_at: values.server_updated_at,
            }),
          )
          .execute();
      }
    },

    async listSince(userId, since, limit) {
      let query = db
        .selectFrom("items")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);

      if (since !== null) {
        query = query.where("server_updated_at", ">", new Date(since));
      }

      const rows = await query.execute();
      return rows.map(toWire);
    },
  };
}

export function createPostgresItemRepository(db: Kysely<DB>): ServerItemRepository {
  return createRepo(db, false);
}
