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
import { DEFAULT_LIST_SORT, type ListSort, sortItemsForList } from "../domain/list-sort";
import { merge } from "../domain/merge";
import { normalizeText } from "../domain/text";
import { readingActivityFieldStamps } from "./books/reading-activity";
import { watchActivityFieldStamps } from "./movies/watch-activity";
import { createUpsertBookFromCatalog } from "./books/upsert-from-catalog";
import type { UpsertBookFromCatalogInput } from "./books/upsert-from-catalog";
import { createUpsertMovieFromCatalog } from "./movies/upsert-from-catalog";
import type { UpsertMovieFromCatalogInput } from "./movies/upsert-from-catalog";
import {
  createUpsertMusicArtistFromCatalog,
  createUpsertMusicTrackFromCatalog,
} from "./music/upsert-from-catalog";
import type {
  UpsertMusicArtistFromCatalogInput,
  UpsertMusicTrackFromCatalogInput,
} from "./music/upsert-from-catalog";
import type { IdGenerator } from "./ports/id-generator";
import type { ItemRepository, Unsubscribe } from "./ports/item-repository";
import type { CookbookUseCases } from "./cookbooks/cookbook-use-cases";

export type RecipeSourcePayload = {
  cookbookId: string | null;
  sourcePage: string | null;
  pendingCookbookTitle?: string | null;
  cookbookAuthor?: string | null;
  cookbookIsbn?: string | null;
};

export type CreateItemExtra = Partial<Omit<NewItemInput, "id" | "type" | "title" | "createdAt">> & {
  recipeSource?: RecipeSourcePayload;
};

export type ItemUseCasesDeps = {
  repository: ItemRepository;
  idGenerator: IdGenerator;
  now: () => number;
  cookbooks?: CookbookUseCases;
};

export type ItemUseCases = {
  createItem(type: ItemType, title: string, extra?: CreateItemExtra): Promise<Item>;
  updateItem(id: string, patch: ItemPatch): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  restoreItem(id: string): Promise<void>;
  getItem(id: string): Promise<Item | undefined>;
  listItems(
    type: ItemType,
    options?: { status?: ItemStatus; sort?: ListSort },
  ): Promise<Item[]>;
  counts(): Promise<Record<ItemType, number>>;
  recent(limit: number): Promise<Item[]>;
  recommenders(prefix: string): Promise<string[]>;
  subscribe(listener: () => void): Unsubscribe;
  applyRemote(rows: ItemWire[]): Promise<void>;
  upsertBookFromCatalog(input: UpsertBookFromCatalogInput): Promise<Item>;
  upsertMovieFromCatalog(input: UpsertMovieFromCatalogInput): Promise<Item>;
  upsertMusicArtistFromCatalog(input: UpsertMusicArtistFromCatalogInput): Promise<Item>;
  upsertMusicTrackFromCatalog(input: UpsertMusicTrackFromCatalogInput): Promise<Item>;
  musicArtistSuggestions(prefix: string): Promise<string[]>;
  createRecipe(
    title: string,
    extra?: Omit<CreateItemExtra, "recipeSource">,
    source?: RecipeSourcePayload,
  ): Promise<Item>;
  updateRecipe(
    id: string,
    patch: ItemPatch,
    source?: RecipeSourcePayload,
  ): Promise<Item>;
};

const byNewest = (a: Item, b: Item): number =>
  a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function createItemUseCases({
  repository,
  idGenerator,
  now,
  cookbooks,
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

  const upsertBookFromCatalog = createUpsertBookFromCatalog({
    repository,
    idGenerator,
    now,
  });

  const upsertMovieFromCatalog = createUpsertMovieFromCatalog({
    repository,
    idGenerator,
    now,
  });

  const upsertMusicArtistFromCatalog = createUpsertMusicArtistFromCatalog({
    repository,
    idGenerator,
    now,
  });

  const upsertMusicTrackFromCatalog = createUpsertMusicTrackFromCatalog({
    repository,
    idGenerator,
    now,
  });

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
    const patchFields = Object.fromEntries(changed) as ItemPatch;
    const activityStamps = {
      ...readingActivityFieldStamps(current, patchFields, stamp),
      ...watchActivityFieldStamps(current, patchFields, stamp),
    };
    const updated = applyPatch(current, {
      ...patchFields,
      fieldsUpdatedAt: {
        ...Object.fromEntries(changed.map(([key]) => [key, stamp])),
        ...activityStamps,
      },
    });
    await repository.put(updated, { enqueue: true });
    return updated;
  }

  async function resolveRecipeSource(
    source: RecipeSourcePayload | undefined,
  ): Promise<{ cookbookId: string | null; sourcePage: string | null }> {
    if (source === undefined || cookbooks === undefined) {
      return { cookbookId: null, sourcePage: null };
    }
    let cookbookId = source.cookbookId;
    let sourcePage = source.sourcePage?.trim() ? source.sourcePage.trim() : null;

    if (source.pendingCookbookTitle?.trim()) {
      const created = await cookbooks.upsertCookbook({
        title: source.pendingCookbookTitle.trim(),
        author: source.cookbookAuthor ?? null,
        isbn: source.cookbookIsbn ?? null,
      });
      cookbookId = created.id;
    } else if (cookbookId) {
      const existing = await cookbooks.getCookbook(cookbookId);
      if (existing !== undefined) {
        await cookbooks.upsertCookbook({
          id: cookbookId,
          title: existing.title,
          author:
            source.cookbookAuthor !== undefined ? source.cookbookAuthor : existing.author,
          isbn: source.cookbookIsbn !== undefined ? source.cookbookIsbn : existing.isbn,
        });
      }
    }

    if (!cookbookId) sourcePage = null;
    return { cookbookId, sourcePage };
  }

  return {
    createItem: (type, title, extra = {}) =>
      serialized(async () => {
        const { recipeSource, ...rest } = extra;
        let itemExtra = rest;
        if (type === "recipe") {
          const sourceFields = await resolveRecipeSource(recipeSource);
          itemExtra = { ...itemExtra, ...sourceFields };
        }
        const createdAt = new Date(now()).toISOString();
        const item = newItem({ ...itemExtra, id: idGenerator.newId(), type, title, createdAt });
        const stamp = await nextStamp();
        const provided = Object.entries(itemExtra)
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

    createRecipe: (title, extra = {}, source) =>
      serialized(async () => {
        const sourceFields = await resolveRecipeSource(source);
        const createdAt = new Date(now()).toISOString();
        const item = newItem({
          ...extra,
          ...sourceFields,
          id: idGenerator.newId(),
          type: "recipe",
          title,
          createdAt,
        });
        const stamp = await nextStamp();
        const provided = Object.entries({ ...extra, ...sourceFields })
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key]) => key);
        const stamped: Item = {
          ...item,
          fieldsUpdatedAt: Object.fromEntries(["title", ...provided].map((key) => [key, stamp])),
        };
        await repository.put(stamped, { enqueue: true });
        return stamped;
      }),

    updateRecipe: (id, patch, source) =>
      serialized(async () => {
        const sourceFields = await resolveRecipeSource(source);
        const mergedPatch =
          source === undefined
            ? patch
            : {
                ...patch,
                cookbookId: sourceFields.cookbookId,
                sourcePage: sourceFields.sourcePage,
              };
        return patchItem(id, mergedPatch);
      }),

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

    listItems: async (type, options = {}) => {
      const rows = await repository.query({ type, status: options.status });
      return sortItemsForList(rows, options.sort ?? DEFAULT_LIST_SORT);
    },

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

    upsertBookFromCatalog: (input) => serialized(() => upsertBookFromCatalog(input)),

    upsertMovieFromCatalog: (input) => serialized(() => upsertMovieFromCatalog(input)),

    upsertMusicArtistFromCatalog: (input) =>
      serialized(() => upsertMusicArtistFromCatalog(input)),

    upsertMusicTrackFromCatalog: (input) => serialized(() => upsertMusicTrackFromCatalog(input)),

    musicArtistSuggestions: async (prefix) => {
      const wanted = normalizeText(prefix);
      const seen = new Map<string, string>();
      for (const item of await repository.query({ type: "music_artist" })) {
        if (item.deletedAt !== null) continue;
        const title = item.title;
        if (!normalizeText(title).startsWith(wanted)) continue;
        if (!seen.has(title)) seen.set(title, title);
      }
      return [...seen.values()].sort((a, b) => a.localeCompare(b, "fr"));
    },

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
