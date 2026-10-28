export const RECAP_DOMAIN_IDS = [
  "book",
  "movie",
  "music_track",
  "recipe",
  "fitness",
  "plants",
] as const;

export type RecapDomainId = (typeof RECAP_DOMAIN_IDS)[number];

export type RecapPeriodGranularity = "week" | "month" | "day" | "year";

export type RecapPeriod = {
  granularity: RecapPeriodGranularity;
  anchorDate: string;
  timeZone: string;
};

export type RecapPeriodResolved = RecapPeriod & {
  startDate: string;
  endDate: string;
  labelFr: string;
};

export type RecapMusicLineKind =
  | "listened"
  | "composition_finished"
  | "dj_performed"
  | "practice_session"
  | "improvisation";

export type RecapAchievement = {
  domainId: RecapDomainId;
  occurredOn: string;
  sortInstant: string;
  title: string;
  subtitle?: string;
  musicLineKind?: RecapMusicLineKind;
  sourceItemId?: string;
  sourceWorkoutId?: string;
  sourceCompositionId?: string;
  sourceDjSetId?: string;
  sourcePracticeLogId?: string;
  sourcePlantCareEventId?: string;
  sourceVegetableMilestoneId?: string;
  deepLinkHref?: string;
};

export type RecapSection = {
  domainId: RecapDomainId;
  labelFr: string;
  count: number;
  achievements: RecapAchievement[];
  visible: boolean;
};

export type RecapActivityDay = {
  calendarDate: string;
  domainsPresent: RecapDomainId[];
  eventCount: number;
  isActive: boolean;
};

/** Trailing heatmap window ending today (OD-011-1 / OD-011-11). */
export type RecapActivityViewportWindow = "365" | "84";

export type RecapSnapshot = {
  period: RecapPeriodResolved;
  sections: RecapSection[];
  totalCount: number;
  activityDays: RecapActivityDay[];
  empty: boolean;
};

export const DEFAULT_RECAP_TIMEZONE = "Europe/Paris";

export const RECAP_SECTION_LABEL_FR: Record<RecapDomainId, string> = {
  book: "Livres",
  movie: "Films & séries",
  music_track: "Musique",
  recipe: "Recettes",
  fitness: "Entraînement",
  plants: "Plantes",
};

export function compareAchievements(a: RecapAchievement, b: RecapAchievement): number {
  if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1;
  return a.title.localeCompare(b.title, "fr");
}

export function orderDomainsPresent(domains: Iterable<RecapDomainId>): RecapDomainId[] {
  const set = new Set(domains);
  return RECAP_DOMAIN_IDS.filter((id) => set.has(id));
}
