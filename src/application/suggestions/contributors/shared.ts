import type { ActivitySuggestionCandidate } from "@/domain/activity-suggestion";
import type { Item } from "@/domain/item";
import { deriveReadingActivityDays } from "@/application/books/reading-activity";
import type { SuggestionsDeps } from "@/application/suggestions/build-daily-suggestions";
import { daysSinceLocalDate, maxLocalDate } from "@/application/suggestions/calendar";
import { fieldStampToLocalDateKey, toLocalDateKey } from "@/application/shared/activity-days";

export type ContributorContext = {
  calendarDay: string;
  timeZone: string;
};

export type DomainStaleContributor = {
  domainId: ActivitySuggestionCandidate["domainId"];
  listStaleCandidates(
    deps: SuggestionsDeps,
    ctx: ContributorContext,
  ): Promise<ActivitySuggestionCandidate[]>;
};

export function bookActivityAnchor(item: Item, timeZone: string): string | null {
  if (item.type !== "book" || item.deletedAt !== null || !item.title.trim()) {
    return null;
  }
  const days = deriveReadingActivityDays([item], timeZone);
  if (days.size > 0) {
    return maxLocalDate(...days);
  }
  const statusTouch = item.fieldsUpdatedAt.status;
  if (statusTouch) {
    return fieldStampToLocalDateKey(statusTouch, timeZone);
  }
  return toLocalDateKey(item.createdAt, timeZone);
}

export function makeCandidate(
  partial: Omit<ActivitySuggestionCandidate, "score"> & { minStaleDays: number },
  calendarDay: string,
): ActivitySuggestionCandidate | null {
  const score = daysSinceLocalDate(partial.staleAnchorDate, calendarDay);
  if (score < partial.minStaleDays) return null;
  const { minStaleDays: _min, ...rest } = partial;
  return { ...rest, score };
}
