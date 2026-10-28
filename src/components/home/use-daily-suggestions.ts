"use client";

import { useCallback, useEffect, useState } from "react";
import { getSuggestionsUseCases } from "@/composition/client";
import type { ActivitySuggestionsViewModel, DailyActivitySuggestionSnapshot } from "@/domain/activity-suggestion";

export type DailySuggestionsState = {
  snapshot: DailyActivitySuggestionSnapshot | null;
  viewModel: ActivitySuggestionsViewModel | null;
  loading: boolean;
  refresh: () => Promise<void>;
  dismissSlot: (slotId: string) => Promise<void>;
  dismissBlock: () => Promise<void>;
};

export function useDailySuggestions(): DailySuggestionsState {
  const [snapshot, setSnapshot] = useState<DailyActivitySuggestionSnapshot | null>(null);
  const [viewModel, setViewModel] = useState<ActivitySuggestionsViewModel | null>(null);
  const [loading, setLoading] = useState(true);

  const applySnapshot = useCallback((next: DailyActivitySuggestionSnapshot, useCases: Awaited<ReturnType<typeof getSuggestionsUseCases>>) => {
    setSnapshot(next);
    setViewModel(useCases.getViewModel(next));
  }, []);

  const loadFirstVisit = useCallback(async () => {
    const useCases = await getSuggestionsUseCases();
    const next = await useCases.buildDailySuggestions({ trigger: "accueil_first_visit" });
    applySnapshot(next, useCases);
    setLoading(false);
  }, [applySnapshot]);

  useEffect(() => {
    void loadFirstVisit();
  }, [loadFirstVisit]);

  const refresh = useCallback(async () => {
    const useCases = await getSuggestionsUseCases();
    const next = await useCases.refreshToday();
    applySnapshot(next, useCases);
  }, [applySnapshot]);

  const dismissSlot = useCallback(
    async (slotId: string) => {
      const useCases = await getSuggestionsUseCases();
      const day = useCases.todayCalendarDay();
      await useCases.dismissSlot(day, slotId);
      const stored = await useCases.buildDailySuggestions({ trigger: "read_only", calendarDay: day });
      applySnapshot(stored, useCases);
    },
    [applySnapshot],
  );

  const dismissBlock = useCallback(async () => {
    const useCases = await getSuggestionsUseCases();
    const day = useCases.todayCalendarDay();
    await useCases.dismissBlock(day);
    const stored = await useCases.buildDailySuggestions({ trigger: "read_only", calendarDay: day });
    applySnapshot(stored, useCases);
  }, [applySnapshot]);

  return { snapshot, viewModel, loading, refresh, dismissSlot, dismissBlock };
}
