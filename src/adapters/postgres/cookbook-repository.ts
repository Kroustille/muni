import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerCookbookRepository } from "@/application/ports/cookbook-repository";
import {
  cookbookToWire,
  wireToCookbook,
  type Cookbook,
  type CookbookWire,
} from "@/domain/cookbook";
import type { Cookbooks, DB } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<Cookbooks>): Cookbook {
  return wireToCookbook({
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    created_at: toIso(row.created_at),
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as CookbookWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(
  userId: string,
  wire: CookbookWire,
  serverUpdatedAt: string,
): Insertable<Cookbooks> {
  const cookbook = wireToCookbook(wire);
  return {
    user_id: userId,
    id: cookbook.id,
    title: cookbook.title,
    author: cookbook.author,
    isbn: cookbook.isbn,
    created_at: cookbook.createdAt,
    deleted_at: cookbook.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerCookbookRepository {
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
        .selectFrom("cookbooks")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();

      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, cookbook) {
      if (!inTransaction) {
        throw new Error("upsert must run inside transaction");
      }
      const wire = cookbookToWire(cookbook);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("cookbooks")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            title: values.title,
            author: values.author,
            isbn: values.isbn,
            created_at: values.created_at,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToCookbook({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("cookbooks")
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

export function createPostgresCookbookRepository(db: Kysely<DB>): ServerCookbookRepository {
  return createRepo(db, false);
}
