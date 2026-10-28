import { formatHlc, parseHlc, receiveHlc, type Hlc } from "@/domain/clock";
import {
  cookbookToWire,
  mergeCookbook,
  wireToCookbook,
  type CookbookWire,
} from "@/domain/cookbook";
import type { CookbookRepository } from "@/application/ports/cookbook-repository";
import type { ItemRepository } from "@/application/ports/item-repository";
import { createListCookbooks } from "./list-cookbooks";
import { createUpsertCookbook } from "./upsert-cookbook";
import { searchCookbooks as filterCookbooks } from "./search-cookbooks";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Cookbook } from "@/domain/cookbook";

export type CookbookUseCasesDeps = {
  repository: CookbookRepository;
  meta: ItemRepository["meta"];
  idGenerator: IdGenerator;
  now: () => number;
};

export type CookbookUseCases = {
  listCookbooks(): Promise<Cookbook[]>;
  searchCookbooks(query: string): Promise<Cookbook[]>;
  upsertCookbook(input: import("@/domain/cookbook").UpsertCookbookInput): Promise<Cookbook>;
  getCookbook(id: string): Promise<Cookbook | undefined>;
  applyRemote(rows: CookbookWire[]): Promise<void>;
  subscribe(listener: () => void): () => void;
};

export function createCookbookUseCases(deps: CookbookUseCasesDeps): CookbookUseCases {
  const list = createListCookbooks(deps);
  const upsert = createUpsertCookbook(deps);
  let queue: Promise<unknown> = Promise.resolve();
  const serialized = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  async function deviceId(): Promise<string> {
    const existing = await deps.meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = deps.idGenerator.newId();
    await deps.meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await deps.meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  return {
    listCookbooks: () => list.listCookbooks(),
    searchCookbooks: async (query) => filterCookbooks(await list.listCookbooks(), query),
    upsertCookbook: (input) => upsert.upsertCookbook(input),
    getCookbook: (id) => deps.repository.get(id),
    subscribe: (listener) => deps.repository.subscribe(listener),

    applyRemote: (rows) =>
      serialized(async () => {
        const id = await deviceId();
        let clock = await loadClock();
        for (const remote of rows) {
          const local = await deps.repository.get(remote.id);
          const merged =
            local === undefined
              ? remote
              : mergeCookbook(cookbookToWire(local), remote);
          for (const stamp of Object.values(remote.fields_updated_at)) {
            clock = receiveHlc(clock, stamp, id, deps.now());
          }
          await deps.repository.upsert(wireToCookbook(merged), { enqueue: false });
        }
        if (clock !== null) await deps.meta.set("hlcState", formatHlc(clock));
      }),
  };
}
