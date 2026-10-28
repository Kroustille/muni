import type { MuniDb } from "./db";
import type { ActivitySuggestionStore } from "@/application/ports/activity-suggestion-store";
import type { DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";

export function createIndexedDbActivitySuggestionStore(db: MuniDb): ActivitySuggestionStore {
  return {
    async getSnapshot(calendarDay) {
      return (await db.get("activity_suggestion_snapshot", calendarDay)) ?? null;
    },

    async putSnapshot(snapshot) {
      await db.put("activity_suggestion_snapshot", snapshot);
    },

    async dismissSlot(calendarDay, slotId, dismissedAt) {
      const snapshot = await db.get("activity_suggestion_snapshot", calendarDay);
      if (snapshot === undefined) return;
      const slots = snapshot.slots.map((slot) =>
        slot.slotId === slotId
          ? { ...slot, dismissedAt: dismissedAt.toISOString() }
          : slot,
      );
      await db.put("activity_suggestion_snapshot", { ...snapshot, slots });
    },

    async dismissBlock(calendarDay) {
      const snapshot = await db.get("activity_suggestion_snapshot", calendarDay);
      if (snapshot === undefined) return;
      await db.put("activity_suggestion_snapshot", { ...snapshot, blockDismissed: true });
    },

    async pruneOlderThan(keepDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - keepDays);
      const cutoffKey = cutoff.toISOString().slice(0, 10);
      const tx = db.transaction("activity_suggestion_snapshot", "readwrite");
      const keys = await tx.store.getAllKeys();
      for (const key of keys) {
        if (typeof key === "string" && key < cutoffKey) {
          await tx.store.delete(key);
        }
      }
      await tx.done;
    },
  };
}

export type { DailyActivitySuggestionSnapshot };
