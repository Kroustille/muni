import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerBookQuoteRepository } from "@/application/ports/book-quote-repository";
import {
  bookQuoteToWire,
  wireToBookQuote,
  type BookQuote,
  type BookQuoteWire,
} from "@/domain/book-quote";
import type { DB, BookQuotes } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<BookQuotes>): BookQuote {
  return wireToBookQuote({
    id: row.id,
    book_item_id: row.book_item_id,
    text: row.text,
    page: row.page,
    created_at: toIso(row.created_at),
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as BookQuoteWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(userId: string, wire: BookQuoteWire, serverUpdatedAt: string): Insertable<BookQuotes> {
  const quote = wireToBookQuote(wire);
  return {
    user_id: userId,
    id: quote.id,
    book_item_id: quote.bookItemId,
    text: quote.text,
    page: quote.page,
    created_at: quote.createdAt,
    deleted_at: quote.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerBookQuoteRepository {
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
        .selectFrom("book_quotes")
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();

      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.filter((id) => byId.has(id)).map((id) => toDomain(byId.get(id)!));
    },

    async upsert(userId, quote) {
      if (!inTransaction) {
        throw new Error("upsert must run inside transaction");
      }
      const wire = bookQuoteToWire(quote);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("book_quotes")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            book_item_id: values.book_item_id,
            text: values.text,
            page: values.page,
            created_at: values.created_at,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToBookQuote({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("book_quotes")
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

export function createPostgresBookQuoteRepository(db: Kysely<DB>): ServerBookQuoteRepository {
  return createRepo(db, false);
}
