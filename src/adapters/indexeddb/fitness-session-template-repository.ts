import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessSessionTemplateRepository, Unsubscribe } from "@/application/ports/fitness-session-template-repository";
import type { MuniDb } from "./db";

export function createIndexedDbFitnessSessionTemplateRepository(db: MuniDb): FitnessSessionTemplateRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("fitnessSessionTemplates", id),

    async list() {
      return (await db.getAll("fitnessSessionTemplates")).filter((t) => t.deletedAt === null);
    },

    async upsert(template, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["fitnessSessionTemplates", "fitnessSessionTemplateOutbox"], "readwrite");
      await tx.objectStore("fitnessSessionTemplates").put(template);
      if (enqueue) await tx.objectStore("fitnessSessionTemplateOutbox").put({ id: template.id });
      await tx.done;
      notify();
      return template;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("fitnessSessionTemplateOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("fitnessSessionTemplateOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
