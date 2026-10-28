import { createUuidIdGenerator } from "../adapters/browser/id-generator";
import type { MuniDb } from "../adapters/indexeddb/db";
import { createHttpCookbookRemoteStore } from "../adapters/http/cookbook-remote-store";
import { createIndexedDbCookbookRepository } from "../adapters/indexeddb/cookbook-repository";
import { createCookbookUseCases, type CookbookUseCases } from "../application/cookbooks/cookbook-use-cases";
import { createCookbookSyncEngine } from "../application/cookbook-sync";
import type { ItemRepository } from "../application/ports/item-repository";
import type { PausableSyncEngine } from "./sync-run";

const COOKBOOK_MUTATION_KEYS = ["upsertCookbook"] as const;

export type ClientCookbookBundle = {
  cookbookEngine: PausableSyncEngine;
  cookbookUseCases: CookbookUseCases;
};

export function wireClientCookbookSync(deps: {
  db: MuniDb;
  items: ItemRepository;
  pullLimit: number;
  onLocalWrite: () => void;
  fetch?: typeof fetch;
  baseUrl?: string;
}): ClientCookbookBundle {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = deps.baseUrl ?? "";
  const repository = createIndexedDbCookbookRepository(deps.db);
  const remote = createHttpCookbookRemoteStore({ fetch: fetchFn, baseUrl });
  const idGenerator = createUuidIdGenerator();
  const now = () => Date.now();
  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const baseCookbookUseCases = createCookbookUseCases({
    repository,
    meta: deps.items.meta,
    idGenerator,
    now,
  });

  const cookbookEngine = createCookbookSyncEngine({
    repository,
    meta: deps.items.meta,
    remote,
    cookbooks: baseCookbookUseCases,
    pullLimit: deps.pullLimit,
    sleep,
  });

  const wrapWrites = (useCases: CookbookUseCases): CookbookUseCases => {
    const wrapped = { ...useCases };
    for (const key of COOKBOOK_MUTATION_KEYS) {
      const fn = useCases[key];
      if (typeof fn !== "function") continue;
      (wrapped as Record<string, unknown>)[key] = async (...args: unknown[]) => {
        const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
        deps.onLocalWrite();
        return result;
      };
    }
    return wrapped;
  };

  return {
    cookbookEngine,
    cookbookUseCases: wrapWrites(baseCookbookUseCases),
  };
}
