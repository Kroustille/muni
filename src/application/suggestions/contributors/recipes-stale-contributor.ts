import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";
import { recipeCookedDates } from "@/application/suggestions/contributors/music-tracks-stale-contributor";
import { maxLocalDate } from "@/application/suggestions/calendar";

export const recipesStaleContributor: DomainStaleContributor = {
  domainId: "recipe",
  async listStaleCandidates(deps, ctx) {
    const items = await deps.items.query({ type: "recipe" });
    const candidates = [];

    for (const item of items) {
      if (item.deletedAt !== null || !item.title.trim()) continue;

      const cooked = recipeCookedDates(item);
      const neverCooked = cooked.length === 0;
      const anchor =
        cooked.length > 0
          ? maxLocalDate(...cooked)
          : item.createdAt.slice(0, 10);
      const minStaleDays = neverCooked ? 45 : 30;
      const kind = neverCooked ? "cook_first" : "cook_again";

      const candidate = makeCandidate(
        {
          domainId: "recipe",
          itemId: item.id,
          kind,
          title: item.title,
          subtitle: null,
          staleAnchorDate: anchor,
          deepLink: `/items/${item.id}`,
          primaryActionKey: "suggestions.action.cook",
          minStaleDays,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  },
};
