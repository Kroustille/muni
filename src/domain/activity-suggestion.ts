export const SUGGESTION_DOMAIN_IDS = [
  "book",
  "movie",
  "music_track",
  "recipe",
  "fitness",
  "music_practice",
  "plants",
] as const;

export type SuggestionDomainId = (typeof SUGGESTION_DOMAIN_IDS)[number];

export type SuggestionKind =
  | "resume_reading"
  | "start_to_read"
  | "watch_film"
  | "continue_series"
  | "start_series"
  | "listen_backlog"
  | "cook_first"
  | "cook_again"
  | "resume_training"
  | "unblock_skipped"
  | "advance_composition"
  | "prepare_dj_set"
  | "practice_session"
  | "water_plant"
  | "potager_milestone";

export type ActivitySuggestionCandidate = {
  domainId: SuggestionDomainId;
  itemId: string;
  kind: SuggestionKind;
  title: string;
  subtitle: string | null;
  staleAnchorDate: string;
  score: number;
  deepLink: string;
  primaryActionKey: string;
};

export type ActivitySuggestionSlot = {
  slotId: string;
  candidate: ActivitySuggestionCandidate;
  dismissedAt: string | null;
};

export type DailyActivitySuggestionSnapshot = {
  calendarDay: string;
  snapshotId: string;
  computedAt: string;
  slots: ActivitySuggestionSlot[];
  blockDismissed: boolean;
  timeZone: string;
};

export type ActivitySuggestionsViewModel = {
  introKey: "suggestions.intro";
  visibleSlots: ActivitySuggestionSlot[];
  showPartialEmpty: boolean;
  hidden: boolean;
};
