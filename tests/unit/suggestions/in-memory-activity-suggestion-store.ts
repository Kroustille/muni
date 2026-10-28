import type { ActivitySuggestionStore } from "@/application/ports/activity-suggestion-store";
import type { DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";

export class InMemoryActivitySuggestionStore implements ActivitySuggestionStore {
  private readonly snapshots = new Map<string, DailyActivitySuggestionSnapshot>();

  async getSnapshot(calendarDay: string): Promise<DailyActivitySuggestionSnapshot | null> {
    return this.snapshots.get(calendarDay) ?? null;
  }

  async putSnapshot(snapshot: DailyActivitySuggestionSnapshot): Promise<void> {
    this.snapshots.set(snapshot.calendarDay, structuredClone(snapshot));
  }

  async dismissSlot(calendarDay: string, slotId: string, dismissedAt: Date): Promise<void> {
    const snapshot = this.snapshots.get(calendarDay);
    if (snapshot === undefined) return;
    const slots = snapshot.slots.map((slot) =>
      slot.slotId === slotId ? { ...slot, dismissedAt: dismissedAt.toISOString() } : slot,
    );
    await this.putSnapshot({ ...snapshot, slots });
  }

  async dismissBlock(calendarDay: string): Promise<void> {
    const snapshot = this.snapshots.get(calendarDay);
    if (snapshot === undefined) return;
    await this.putSnapshot({ ...snapshot, blockDismissed: true });
  }

  async pruneOlderThan(_keepDays: number): Promise<void> {
    // no-op for tests
  }
}
