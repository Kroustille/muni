import type { Cookbook } from "@/domain/cookbook";
import type { CookbookRepository } from "@/application/ports/cookbook-repository";

export function createMemoryCookbookRepository(
  seed: Cookbook[] = [],
): CookbookRepository {
  const store = new Map(seed.map((row) => [row.id, row]));
  const outbox = new Set<string>();
  const listeners = new Set<() => void>();

  return {
    get: async (id) => store.get(id),
    listAll: async () => [...store.values()],
    upsert: async (cookbook, options = {}) => {
      store.set(cookbook.id, cookbook);
      if (options.enqueue !== false) outbox.add(cookbook.id);
      for (const listener of listeners) listener();
      return cookbook;
    },
    softDelete: async (id) => {
      const row = store.get(id);
      if (row) store.set(id, { ...row, deletedAt: new Date().toISOString() });
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    outbox: async () => [...outbox],
    clearOutbox: async (ids) => {
      for (const id of ids) outbox.delete(id);
    },
  };
}
