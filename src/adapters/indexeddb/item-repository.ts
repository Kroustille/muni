import type { ItemQuery, ItemRepository, MetaStore } from "../../application/ports/item-repository";
import type { Item } from "../../domain/item";
import type { MuniDb } from "./db";

export function createIndexedDbItemRepository(db: MuniDb): ItemRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  const meta: MetaStore = {
    async get(key) {
      return (await db.get("meta", key)) as never;
    },
    async set(key, value) {
      await db.put("meta", value, key);
    },
  };

  return {
    meta,
    get: (id) => db.get("items", id),
    async put(item: Item, { enqueue }) {
      const tx = db.transaction(["items", "outbox"], "readwrite");
      try {
        await tx.objectStore("items").put(item);
        if (enqueue) await tx.objectStore("outbox").put({ id: item.id });
        await tx.done;
      } catch (error) {
        try {
          tx.abort();
        } catch {
          // transaction already finished or aborted
        }
        await tx.done.catch(() => undefined);
        throw error;
      }
      notify();
    },
    async query(query: ItemQuery = {}) {
      const all = query.type
        ? await db.getAllFromIndex("items", "type", query.type)
        : await db.getAll("items");
      return all
        .filter((item) => query.includeDeleted === true || item.deletedAt === null)
        .filter((item) => query.status === undefined || item.status === query.status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async outbox() {
      return (await db.getAllKeys("outbox")) as string[];
    },
    async clearOutbox(ids) {
      const tx = db.transaction("outbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
