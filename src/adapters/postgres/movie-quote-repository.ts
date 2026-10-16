import type { Insertable, Kysely, Selectable, Transaction } from "kysely";

import type { ServerMovieQuoteRepository } from "@/application/ports/movie-quote-repository";
import {
  movieQuoteToWire,
  wireToMovieQuote,
  type MovieQuote,
  type MovieQuoteWire,
} from "@/domain/movie-quote";
import type { DB, MovieQuotes } from "./db-types";

type DbOrTrx = Kysely<DB> | Transaction<DB>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDomain(row: Selectable<MovieQuotes>): MovieQuote {
  return wireToMovieQuote({
    id: row.id,
    movie_item_id: row.movie_item_id,
    text: row.text,
    context: row.context,
    created_at: toIso(row.created_at),
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
    fields_updated_at: row.fields_updated_at as MovieQuoteWire["fields_updated_at"],
    server_updated_at: toIso(row.server_updated_at),
  });
}

function toRow(userId: string, wire: MovieQuoteWire, serverUpdatedAt: string): Insertable<MovieQuotes> {
  const quote = wireToMovieQuote(wire);
  return {
    user_id: userId,
    id: quote.id,
    movie_item_id: quote.movieItemId,
    text: quote.text,
    context: quote.context,
    created_at: quote.createdAt,
    deleted_at: quote.deletedAt,
    fields_updated_at: wire.fields_updated_at,
    server_updated_at: serverUpdatedAt,
  };
}

function createRepo(db: DbOrTrx, inTransaction: boolean): ServerMovieQuoteRepository {
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
        .selectFrom("movie_quotes")
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
      const wire = movieQuoteToWire(quote);
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = toRow(userId, { ...wire, server_updated_at: serverUpdatedAt }, serverUpdatedAt);
      await db
        .insertInto("movie_quotes")
        .values(values)
        .onConflict((oc) =>
          oc.columns(["user_id", "id"]).doUpdateSet({
            movie_item_id: values.movie_item_id,
            text: values.text,
            context: values.context,
            created_at: values.created_at,
            deleted_at: values.deleted_at,
            fields_updated_at: values.fields_updated_at,
            server_updated_at: values.server_updated_at,
          }),
        )
        .execute();
      return wireToMovieQuote({ ...wire, server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom("movie_quotes")
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

export function createPostgresMovieQuoteRepository(db: Kysely<DB>): ServerMovieQuoteRepository {
  return createRepo(db, false);
}
