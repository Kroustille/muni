import { formatHlc, parseHlc, receiveHlc, tickHlc, type Hlc } from "../domain/clock";
import {
  ITEM_TYPES,
  itemToWire,
  newItem,
  updateItem as applyPatch,
  wireToItem,
  type Item,
  type ItemPatch,
  type ItemStatus,
  type ItemType,
  type ItemWire,
  type NewItemInput,
} from "../domain/item";
import { merge } from "../domain/merge";
import { normalizeText } from "../domain/text";
import type { IdGenerator } from "./ports/id-generator";
import type { ItemRepository, Unsubscribe } from "./ports/item-repository";

export type CreateItemExtra = Partial<Omit<NewItemInput, "id" | "type" | "title" | "createdAt">>;

export type ItemUseCasesDeps = {
  repository: ItemRepository;
  idGenerator: IdGenerator;
  now: () => number;
};

export type ItemUseCases = {
  createItem(type: ItemType, title: string, extra?: CreateItemExtra): Promise<Item>;
  updateItem(id: string, patch: ItemPatch): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  restoreItem(id: string): Promise<void>;
  getItem(id: string): Promise<Item | undefined>;
  listItems(type: ItemType, options?: { status?: ItemStatus }): Promise<Item[]>;
  counts(): Promise<Record<ItemType, number>>;
  recent(limit: number): Promise<Item[]>;
  recommenders(prefix: string): Promise<string[]>;
  subscribe(listener: () => void): Unsubscribe;
  applyRemote(rows: ItemWire[]): Promise<void>;
};

const byNewest = (a: Item, b: Item): number =>
  a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function createItemUseCases({
  repository,
  idGenerator,
  now,
}: ItemUseCasesDeps): ItemUseCases {
  let queue: Promise<unknown> = Promise.resolve();
  const serialized = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  async function deviceId(): Promise<string> {
    const existing = await repository.meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = idGenerator.newId();
    await repository.meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await repository.meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  async function nextStamp(): Promise<string> {
    const next = tickHlc(await loadClock(), await deviceId(), now());
    const stamp = formatHlc(next);
    await repository.meta.set("hlcState", stamp);
    return stamp;
  }

  async function requireItem(id: string): Promise<Item> {
    const item = await repository.get(id);
    if (item === undefined) throw new Error(`Unknown item: ${id}`);
    return item;
  }

  async function patchItem(id: string, patch: ItemPatch): Promise<Item> {
    const current = await requireItem(id);
    const fields = { ...patch };
    delete fields.fieldsUpdatedAt;
    const changed = Object.entries(fields).filter(
      ([key, value]) => value !== undefined && !sameValue(value, current[key as keyof Item]),
    );
    if (changed.length === 0) return applyPatch(current, {});
    applyPatch(current, fields);
    const stamp = await nextStamp();
    const updated = applyPatch(current, {
      ...Object.fromEntries(changed),
      fieldsUpdatedAt: Object.fromEntries(changed.map(([key]) => [key, stamp])),
    });
    await repository.put(updated, { enqueue: true });
    return updated;
  }

  return {
    createItem: (type, title, extra = {}) =>
      serialized(async () => {
        const createdAt = new Date(now()).toISOString();
        const item = newItem({ ...extra, id: idGenerator.newId(), type, title, createdAt });
        const stamp = await nextStamp();
        const provided = Object.entries(extra)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key]) => key);
        const stamped: Item = {
          ...item,
          fieldsUpdatedAt: Object.fromEntries(["title", ...provided].map((key) => [key, stamp])),
        };
        await repository.put(stamped, { enqueue: true });
        return stamped;
      }),

    updateItem: (id, patch) => serialized(() => patchItem(id, patch)),

    deleteItem: (id) =>
      serialized(async () => {
        await requireItem(id);
        await patchItem(id, { deletedAt: new Date(now()).toISOString() });
      }),

    restoreItem: (id) =>
      serialized(async () => {
        await requireItem(id);
        await patchItem(id, { deletedAt: null });
      }),

    getItem: (id) => repository.get(id),

    listItems: async (type, options = {}) =>
      (await repository.query({ type, status: options.status })).sort(byNewest),

    counts: async () => {
      const result = Object.fromEntries(ITEM_TYPES.map((type) => [type, 0])) as Record<
        ItemType,
        number
      >;
      for (const item of await repository.query()) result[item.type] += 1;
      return result;
    },

    recent: async (limit) => (await repository.query()).sort(byNewest).slice(0, Math.max(0, limit)),

    recommenders: async (prefix) => {
      const wanted = normalizeText(prefix);
      const seen = new Map<string, string>();
      for (const item of await repository.query()) {
        const value = item.recommendedBy;
        if (value === null || value === "" || !normalizeText(value).startsWith(wanted)) continue;
        if (!seen.has(value)) seen.set(value, value);
      }
      return [...seen.values()];
    },

    subscribe: (listener) => repository.subscribe(listener),

    applyRemote: (rows) =>
      serialized(async () => {
        const id = await deviceId();
        let clock = await loadClock();
        for (const remote of rows) {
          const local = await repository.get(remote.id);
          const merged = local === undefined ? remote : merge(itemToWire(local), remote);
          for (const stamp of Object.values(remote.fields_updated_at)) {
            clock = receiveHlc(clock, stamp, id, now());
          }
          await repository.put(wireToItem(merged), { enqueue: false });
        }
        if (clock !== null) await repository.meta.set("hlcState", formatHlc(clock));
      }),
  };
}
