import { LIST_TYPE_VISUAL } from "@/components/list-type-visual";
import type { RecapDomainId } from "@/domain/recap";

export const RECAP_DOMAIN_ACCENTS: Record<RecapDomainId, string> = {
  book: LIST_TYPE_VISUAL.book.accentColor,
  movie: LIST_TYPE_VISUAL.movie.accentColor,
  music_track: LIST_TYPE_VISUAL.music_track.accentColor,
  recipe: LIST_TYPE_VISUAL.recipe.accentColor,
  fitness: "#0d9488",
  plants: "#16a34a",
};

export function heatmapSegmentStyles(
  domainsPresent: RecapDomainId[],
): { domainId: RecapDomainId; flex: number; color: string }[] {
  if (domainsPresent.length === 0) return [];
  const flex = 1 / domainsPresent.length;
  return domainsPresent.map((domainId) => ({
    domainId,
    flex,
    color: RECAP_DOMAIN_ACCENTS[domainId],
  }));
}
