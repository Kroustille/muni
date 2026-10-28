import type { SuggestionDomainId } from "@/domain/activity-suggestion";

export function buildItemDeepLink(domainId: SuggestionDomainId, itemId: string): string {
  switch (domainId) {
    case "book":
    case "movie":
    case "music_track":
    case "recipe":
      return `/items/${itemId}`;
    case "fitness":
      return "/fitness";
    case "music_practice":
      return `/music/tracks`;
    case "plants":
      return `/plants/${itemId}`;
    default: {
      const _exhaustive: never = domainId;
      return _exhaustive;
    }
  }
}

export function buildFitnessSkipDeepLink(workoutId: string): string {
  return `/fitness/workout/${workoutId}`;
}
