import { createItemUseCases, type ItemUseCases } from "../application/items";
import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import { openMuniDb } from "../adapters/indexeddb/db";
import { createIndexedDbItemRepository } from "../adapters/indexeddb/item-repository";

export const MUNI_DB_NAME = "muni";

let itemUseCases: Promise<ItemUseCases> | undefined;

/**
 * Lazily builds the client-side item use cases. IndexedDB is only touched on
 * the first call (never at import time), so this module is safe to import
 * during server rendering as long as the getter is called from the browser.
 */
export function getItemUseCases(): Promise<ItemUseCases> {
  itemUseCases ??= openMuniDb(MUNI_DB_NAME).then((db) =>
    createItemUseCases({
      repository: createIndexedDbItemRepository(db),
      idGenerator: createUuidIdGenerator(),
      now: () => Date.now(),
    }),
  );
  return itemUseCases;
}
