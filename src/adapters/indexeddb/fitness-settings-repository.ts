import type { FitnessUserSettings } from "@/domain/fitness/workout-log";
import type {
  FitnessExerciseCatalogStore,
  FitnessSettingsRepository,
  Unsubscribe,
} from "@/application/ports/fitness-settings-repository";
import type { StoredCatalogExercise } from "@/domain/fitness/catalog";
import type { MuniDb } from "./db";

export function createIndexedDbFitnessSettingsRepository(db: MuniDb): FitnessSettingsRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    async get() {
      const rows = await db.getAll("fitnessUserSettings");
      return rows.find((s) => s.deletedAt === null);
    },

    async upsert(settings, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["fitnessUserSettings", "fitnessSettingsOutbox"], "readwrite");
      await tx.objectStore("fitnessUserSettings").put(settings);
      if (enqueue) await tx.objectStore("fitnessSettingsOutbox").put({ id: settings.id });
      await tx.done;
      notify();
      return settings;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("fitnessSettingsOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("fitnessSettingsOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}

export function createIndexedDbFitnessExerciseCatalogStore(
  db: MuniDb,
  meta: import("@/application/ports/item-repository").MetaStore,
): FitnessExerciseCatalogStore {
  return {
    async getVersion() {
      return meta.get("fitnessCatalogVersion");
    },

    async setVersion(version) {
      await meta.set("fitnessCatalogVersion", version);
    },

    async list() {
      return db.getAll("fitnessExerciseCatalog");
    },

    async upsertMany(entries: StoredCatalogExercise[]) {
      const tx = db.transaction("fitnessExerciseCatalog", "readwrite");
      for (const entry of entries) {
        await tx.store.put(entry);
      }
      await tx.done;
    },

    getById: (id) => db.get("fitnessExerciseCatalog", id),
  };
}
