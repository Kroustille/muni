import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { BookQuote } from "../../domain/book-quote";
import type { MovieQuote } from "../../domain/movie-quote";
import type { Item, ItemType } from "../../domain/item";
import type { MetaKey, MetaValues } from "../../application/ports/item-repository";

export interface MuniDbSchema extends DBSchema {
  items: {
    key: string;
    value: Item;
    indexes: { type: ItemType; updatedAt: string; deletedAt: string };
  };
  outbox: {
    key: string;
    value: { id: string };
  };
  bookQuotes: {
    key: string;
    value: BookQuote;
    indexes: { bookItemId: string };
  };
  quoteOutbox: {
    key: string;
    value: { id: string };
  };
  movieQuotes: {
    key: string;
    value: MovieQuote;
    indexes: { movieItemId: string };
  };
  movieQuoteOutbox: {
    key: string;
    value: { id: string };
  };
  meta: {
    key: MetaKey;
    value: MetaValues[MetaKey];
  };
}

export type MuniDb = IDBPDatabase<MuniDbSchema>;

const DB_VERSION = 3;

export function openMuniDb(name: string): Promise<MuniDb> {
  return openDB<MuniDbSchema>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const items = db.createObjectStore("items", { keyPath: "id" });
        items.createIndex("type", "type");
        items.createIndex("updatedAt", "updatedAt");
        items.createIndex("deletedAt", "deletedAt");
        db.createObjectStore("outbox", { keyPath: "id" });
        db.createObjectStore("meta");
      }
      if (oldVersion < 2) {
        const quotes = db.createObjectStore("bookQuotes", { keyPath: "id" });
        quotes.createIndex("bookItemId", "bookItemId");
        db.createObjectStore("quoteOutbox", { keyPath: "id" });
      }
      if (oldVersion < 3) {
        const movieQuotes = db.createObjectStore("movieQuotes", { keyPath: "id" });
        movieQuotes.createIndex("movieItemId", "movieItemId");
        db.createObjectStore("movieQuoteOutbox", { keyPath: "id" });
      }
    },
  });
}
