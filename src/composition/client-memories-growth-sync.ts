import { createHttpMemoriesGrowthRemoteStore } from "../adapters/http/memories-growth-remote-store";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createIndexedDbMemoriesGrowthStores } from "../adapters/indexeddb/memories-growth-repositories";
import type { ItemRepository } from "../application/ports/item-repository";
import type { MemoriesGrowthLocalStores } from "../application/ports/memories-growth-repositories";
import { createMemoriesGrowthSyncEngine } from "../application/sync/memories-growth-sync-engine";
import type { PausableSyncEngine } from "./sync-run";

export type ClientMemoriesGrowthBundle = {
  memoriesGrowthEngine: PausableSyncEngine;
  /** Local stores for 015 use cases; writes must call `onLocalWrite` (US1+). */
  memoriesGrowthStores: MemoriesGrowthLocalStores;
};

export function wireClientMemoriesGrowthSync(deps: {
  db: MuniDb;
  items: ItemRepository;
  pullLimit: number;
  fetch?: typeof fetch;
  baseUrl?: string;
}): ClientMemoriesGrowthBundle {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const stores = createIndexedDbMemoriesGrowthStores(deps.db);
  const memoriesGrowthEngine = createMemoriesGrowthSyncEngine({
    meta: deps.items.meta,
    remote: createHttpMemoriesGrowthRemoteStore({ fetch: fetchFn, baseUrl: deps.baseUrl ?? "" }),
    stores,
    pullLimit: deps.pullLimit,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
  return { memoriesGrowthEngine, memoriesGrowthStores: stores };
}
