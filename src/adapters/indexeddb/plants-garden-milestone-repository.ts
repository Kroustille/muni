import type { VegetableMilestone } from "@/domain/vegetable-milestone";
import type {
  PlantsGardenMilestoneRepository,
  Unsubscribe,
} from "@/application/ports/plants-garden-milestone-repository";
import type { MuniDb } from "./db";

function inCalendarRange(occurredAt: string, from: string, to: string): boolean {
  return occurredAt >= from && occurredAt <= to;
}

export function createIndexedDbPlantsGardenMilestoneRepository(db: MuniDb): PlantsGardenMilestoneRepository {
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => db.get("vegetableMilestones", id),

    async listByCulture(cultureId) {
      const rows = await db.getAllFromIndex("vegetableMilestones", "cultureId", cultureId);
      return rows.filter((m) => m.deletedAt === null);
    },

    async listAll() {
      const rows = await db.getAll("vegetableMilestones");
      return rows.filter((m) => m.deletedAt === null);
    },

    async listInRange(from, to) {
      const rows = await db.getAll("vegetableMilestones");
      return rows.filter(
        (m) => m.deletedAt === null && inCalendarRange(m.occurredAt, from, to),
      );
    },

    async upsert(milestone, options = {}) {
      const enqueue = options.enqueue !== false;
      const tx = db.transaction(["vegetableMilestones", "vegetableMilestoneOutbox"], "readwrite");
      await tx.objectStore("vegetableMilestones").put(milestone);
      if (enqueue) await tx.objectStore("vegetableMilestoneOutbox").put({ id: milestone.id });
      await tx.done;
      notify();
      return milestone;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async outbox() {
      return (await db.getAllKeys("vegetableMilestoneOutbox")) as string[];
    },

    async clearOutbox(ids) {
      const tx = db.transaction("vegetableMilestoneOutbox", "readwrite");
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
  };
}
