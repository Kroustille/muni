import { openDB, type DBSchema, type IDBPDatabase } from "idb";

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
  meta: {
    key: MetaKey;
    value: MetaValues[MetaKey];
  };
}

export type MuniDb = IDBPDatabase<MuniDbSchema>;

const DB_VERSION = 1;

export function openMuniDb(name: string): Promise<MuniDb> {
  return openDB<MuniDbSchema>(name, DB_VERSION, {
    upgrade(db) {
      const items = db.createObjectStore("items", { keyPath: "id" });
      items.createIndex("type", "type");
      items.createIndex("updatedAt", "updatedAt");
      items.createIndex("deletedAt", "deletedAt");
      db.createObjectStore("outbox", { keyPath: "id" });
      db.createObjectStore("meta");
    },
  });
}
