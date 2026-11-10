import type {
  MemoriesGrowthLocalStores,
  SyncedLocalStore,
  Unsubscribe,
} from "@/application/ports/memories-growth-repositories";
import type { MuniDb } from "./db";

type EntityStore = "souvenirs" | "goals" | "goalCheckins" | "achievements";
type OutboxStore = "souvenirOutbox" | "goalOutbox" | "goalCheckinOutbox" | "achievementOutbox";

/** One IndexedDB object store + its outbox for a synced 015 entity. */
function createSyncedStore<T extends { id: string; deletedAt: string | null }>(
  db: MuniDb,
  store: EntityStore,
  outbox: OutboxStore,
): SyncedLocalStore<T> {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: async (id) => (await db.get(store, id)) as T | undefined,

    async list(includeDeleted = false) {
      const rows = (await db.getAll(store)) as unknown as T[];
      return includeDeleted ? rows : rows.filter((row) => row.deletedAt === null);
    },

    async upsert(row, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction([store, outbox], "readwrite");
      await tx.objectStore(store).put(row as never);
      if (enqueue) await tx.objectStore(outbox).put({ id: row.id });
      await tx.done;
      notify();
      return row;
    },

    subscribe(listener): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys(outbox)) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction(outbox, "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}

export function createIndexedDbMemoriesGrowthStores(db: MuniDb): MemoriesGrowthLocalStores {
  return {
    souvenirs: createSyncedStore(db, "souvenirs", "souvenirOutbox"),
    goals: createSyncedStore(db, "goals", "goalOutbox"),
    goalCheckins: createSyncedStore(db, "goalCheckins", "goalCheckinOutbox"),
    achievements: createSyncedStore(db, "achievements", "achievementOutbox"),
  };
}
