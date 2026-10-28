import type { DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";

export interface ActivitySuggestionStore {
  getSnapshot(calendarDay: string): Promise<DailyActivitySuggestionSnapshot | null>;
  putSnapshot(snapshot: DailyActivitySuggestionSnapshot): Promise<void>;
  dismissSlot(calendarDay: string, slotId: string, dismissedAt: Date): Promise<void>;
  dismissBlock(calendarDay: string): Promise<void>;
  pruneOlderThan(keepDays: number): Promise<void>;
}
