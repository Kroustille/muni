import type { Cookbook } from "@/domain/cookbook";
import type { CookbookRepository, Unsubscribe } from "@/application/ports/cookbook-repository";
import type { MuniDb } from "./db";

export function createIndexedDbCookbookRepository(db: MuniDb): CookbookRepository {
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("cookbooks", id),

    async listAll() {
      const rows = await db.getAll("cookbooks");
      return rows.filter((row) => row.deletedAt === null);
    },

    async upsert(cookbook, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["cookbooks", "cookbookOutbox"], "readwrite");
      try {
        await tx.objectStore("cookbooks").put(cookbook);
        if (enqueue) await tx.objectStore("cookbookOutbox").put({ id: cookbook.id });
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
      return cookbook;
    },

    async softDelete(id) {
      const existing = await db.get("cookbooks", id);
      if (existing === undefined) return;
      await this.upsert({ ...existing, deletedAt: new Date().toISOString() });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async outbox() {
      return (await db.getAllKeys("cookbookOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("cookbookOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
