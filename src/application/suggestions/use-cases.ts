import type {
  BuildDailySuggestionsInput,
  SuggestionsDeps,
} from "@/application/suggestions/build-daily-suggestions";
import {
  buildDailySuggestions,
  getSuggestionsViewModel,
  refreshDailySuggestions,
} from "@/application/suggestions/build-daily-suggestions";
import type { ActivitySuggestionsViewModel, DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";
import { localCalendarDay } from "@/application/suggestions/calendar";
import { DEFAULT_SUGGESTIONS_TIMEZONE } from "@/application/suggestions/calendar";

export type SuggestionsUseCases = {
  buildDailySuggestions(
    input: BuildDailySuggestionsInput,
  ): Promise<DailyActivitySuggestionSnapshot>;
  refreshToday(): Promise<DailyActivitySuggestionSnapshot>;
  getViewModel(snapshot: DailyActivitySuggestionSnapshot): ActivitySuggestionsViewModel;
  dismissSlot(calendarDay: string, slotId: string): Promise<void>;
  dismissBlock(calendarDay: string): Promise<void>;
  todayCalendarDay(): string;
};

export function createSuggestionsUseCases(deps: SuggestionsDeps): SuggestionsUseCases {
  return {
    buildDailySuggestions: (input) => buildDailySuggestions(deps, input),
    refreshToday: () =>
      refreshDailySuggestions(deps, localCalendarDay(deps.now()), DEFAULT_SUGGESTIONS_TIMEZONE),
    getViewModel: getSuggestionsViewModel,
    dismissSlot: async (calendarDay, slotId) => {
      await deps.suggestionStore.dismissSlot(calendarDay, slotId, new Date(deps.now()));
    },
    dismissBlock: async (calendarDay) => {
      await deps.suggestionStore.dismissBlock(calendarDay);
    },
    todayCalendarDay: () => localCalendarDay(deps.now(), DEFAULT_SUGGESTIONS_TIMEZONE),
  };
}
