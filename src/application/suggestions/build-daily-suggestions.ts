import type { IdGenerator } from "@/application/ports/id-generator";
import type { ItemRepository } from "@/application/ports/item-repository";
import type { FitnessProgramRepository } from "@/application/ports/fitness-program-repository";
import type { FitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import type { FitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import type { ActivitySuggestionStore } from "@/application/ports/activity-suggestion-store";
import type {
  ActivitySuggestionCandidate,
  ActivitySuggestionSlot,
  ActivitySuggestionsViewModel,
  DailyActivitySuggestionSnapshot,
} from "@/domain/activity-suggestion";
import { localCalendarDay } from "@/application/suggestions/calendar";
import { DEFAULT_SUGGESTIONS_TIMEZONE } from "@/application/suggestions/calendar";
import { allStaleContributors, type ContributorContext } from "@/application/suggestions/contributors";
import { pickCandidatesForSlots } from "@/application/suggestions/select-pair";

export type BuildSuggestionsTrigger =
  | "accueil_first_visit"
  | "manual_refresh"
  | "read_only";

export type SuggestionsDeps = {
  items: ItemRepository;
  suggestionStore: ActivitySuggestionStore;
  fitnessPrograms?: FitnessProgramRepository;
  fitnessWorkouts?: FitnessWorkoutRepository;
  fitnessSkips?: FitnessSkipRepository;
  musicPractice?: MusicPracticeSuggestionPorts;
  plants?: PlantsSuggestionPorts;
  idGenerator: IdGenerator;
  now: () => number;
};

/** Optional 012 ports — absent until music-practice ships. */
export type MusicPracticeSuggestionPorts = {
  listCompositions(): Promise<MusicPracticeCompositionRow[]>;
  listDjSets(): Promise<MusicPracticeDjSetRow[]>;
  listPracticePlans(): Promise<MusicPracticePlanRow[]>;
  listPracticeLogs(): Promise<MusicPracticeLogRow[]>;
};

export type MusicPracticeCompositionRow = {
  id: string;
  title: string;
  status: "idea" | "in_progress" | "finished";
  deletedAt: string | null;
  statusUpdatedAt: string | null;
  lastSessionAt: string | null;
};

export type MusicPracticeDjSetRow = {
  id: string;
  title: string;
  status: "planned" | "performed" | "cancelled";
  deletedAt: string | null;
  plannedDate: string | null;
  performedAt: string | null;
  statusUpdatedAt: string | null;
};

export type MusicPracticePlanRow = {
  id: string;
  instrument: string;
  active: boolean;
  startedAt: string | null;
  deletedAt: string | null;
};

export type MusicPracticeLogRow = {
  id: string;
  planId: string;
  practicedAt: string;
  deletedAt: string | null;
};

/** Optional 013 ports — absent until plants ships. */
export type PlantsSuggestionPorts = {
  listPlants(): Promise<PlantSuggestionRow[]>;
  listCareEvents(): Promise<PlantCareEventRow[]>;
  listVegetableCultures(): Promise<VegetableCultureRow[]>;
};

export type PlantSuggestionRow = {
  id: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
};

export type PlantCareEventRow = {
  id: string;
  plantId: string;
  eventType: "water" | string;
  occurredAt: string;
  deletedAt: string | null;
};

export type VegetableCultureRow = {
  id: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  lastMilestoneAt: string | null;
};

export type BuildDailySuggestionsInput = {
  calendarDay?: string;
  timeZone?: string;
  trigger: BuildSuggestionsTrigger;
};

async function buildCandidatePool(
  deps: SuggestionsDeps,
  ctx: ContributorContext,
  excludeItemIds: ReadonlySet<string>,
): Promise<ActivitySuggestionCandidate[]> {
  const merged: ActivitySuggestionCandidate[] = [];
  for (const contributor of allStaleContributors) {
    try {
      const batch = await contributor.listStaleCandidates(deps, ctx);
      for (const candidate of batch) {
        if (!excludeItemIds.has(candidate.itemId)) {
          merged.push(candidate);
        }
      }
    } catch {
      // FR-013 graceful degradation
    }
  }
  return merged;
}

function dismissedItemIds(snapshot: DailyActivitySuggestionSnapshot): Set<string> {
  const ids = new Set<string>();
  for (const slot of snapshot.slots) {
    if (slot.dismissedAt !== null) {
      ids.add(slot.candidate.itemId);
    }
  }
  return ids;
}

function refreshOpenSlots(
  candidates: ActivitySuggestionCandidate[],
  deps: SuggestionsDeps,
  existingSlots: ActivitySuggestionSlot[],
): ActivitySuggestionSlot[] {
  const keptDismissed = existingSlots.filter((s) => s.dismissedAt !== null);
  const openBudget = Math.max(0, 2 - keptDismissed.length);
  const newOpen: ActivitySuggestionSlot[] = candidates.slice(0, openBudget).map((candidate) => ({
    slotId: deps.idGenerator.newId(),
    candidate,
    dismissedAt: null,
  }));
  return [...keptDismissed, ...newOpen].slice(0, 2);
}

function createSnapshot(
  calendarDay: string,
  timeZone: string,
  slots: ActivitySuggestionSlot[],
  deps: SuggestionsDeps,
  blockDismissed: boolean,
): DailyActivitySuggestionSnapshot {
  return {
    calendarDay,
    snapshotId: deps.idGenerator.newId(),
    computedAt: new Date(deps.now()).toISOString(),
    slots,
    blockDismissed,
    timeZone,
  };
}

export async function buildDailySuggestions(
  deps: SuggestionsDeps,
  input: BuildDailySuggestionsInput,
): Promise<DailyActivitySuggestionSnapshot> {
  const timeZone = input.timeZone ?? DEFAULT_SUGGESTIONS_TIMEZONE;
  const calendarDay = input.calendarDay ?? localCalendarDay(deps.now(), timeZone);
  const ctx: ContributorContext = { calendarDay, timeZone };

  const existing = await deps.suggestionStore.getSnapshot(calendarDay);

  if (input.trigger === "read_only") {
    return (
      existing ??
      createSnapshot(calendarDay, timeZone, [], deps, false)
    );
  }

  if (existing !== null && input.trigger === "accueil_first_visit") {
    return existing;
  }

  const excludeIds = existing ? dismissedItemIds(existing) : new Set<string>();
  const pool = await buildCandidatePool(deps, ctx, excludeIds);

  if (existing !== null && input.trigger === "manual_refresh") {
    const openBudget = 2 - existing.slots.filter((s) => s.dismissedAt !== null).length;
    const picks = pickCandidatesForSlots(pool, openBudget, excludeIds);
    const slots = refreshOpenSlots(picks, deps, existing.slots);
    const updated: DailyActivitySuggestionSnapshot = {
      ...existing,
      slots,
      computedAt: new Date(deps.now()).toISOString(),
    };
    await deps.suggestionStore.putSnapshot(updated);
    return updated;
  }

  const picks = pickCandidatesForSlots(pool, 2, new Set());
  const slots: ActivitySuggestionSlot[] = picks.map((candidate) => ({
    slotId: deps.idGenerator.newId(),
    candidate,
    dismissedAt: null,
  }));

  const snapshot = createSnapshot(calendarDay, timeZone, slots, deps, false);
  await deps.suggestionStore.putSnapshot(snapshot);
  return snapshot;
}

export function getSuggestionsViewModel(
  snapshot: DailyActivitySuggestionSnapshot,
): ActivitySuggestionsViewModel {
  if (snapshot.blockDismissed) {
    return {
      introKey: "suggestions.intro",
      visibleSlots: [],
      showPartialEmpty: false,
      hidden: true,
    };
  }

  const visibleSlots = snapshot.slots.filter((s) => s.dismissedAt === null);
  if (visibleSlots.length === 0 && snapshot.slots.length === 0) {
    return {
      introKey: "suggestions.intro",
      visibleSlots: [],
      showPartialEmpty: false,
      hidden: true,
    };
  }

  const showPartialEmpty = visibleSlots.length === 1;
  return {
    introKey: "suggestions.intro",
    visibleSlots,
    showPartialEmpty,
    hidden: false,
  };
}

export async function refreshDailySuggestions(
  deps: SuggestionsDeps,
  calendarDay?: string,
  timeZone?: string,
): Promise<DailyActivitySuggestionSnapshot> {
  return buildDailySuggestions(deps, {
    calendarDay,
    timeZone,
    trigger: "manual_refresh",
  });
}
