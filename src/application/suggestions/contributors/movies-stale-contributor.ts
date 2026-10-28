import { computeNextEpisode } from "@/application/movies/episode-progress";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";
import { toLocalDateKey } from "@/application/shared/activity-days";

export const moviesStaleContributor: DomainStaleContributor = {
  domainId: "movie",
  async listStaleCandidates(deps, ctx) {
    const items = await deps.items.query({ type: "movie" });
    const candidates = [];

    for (const item of items) {
      if (item.deletedAt !== null || !item.title.trim()) continue;

      if (item.mediaKind === "series") {
        const progress = item.episodeProgress ?? {};
        const watchedDates = Object.values(progress)
          .map((entry) => entry.watchedAt)
          .filter(Boolean) as string[];
        const nextKey = computeNextEpisode(item.episodeProgress);
        const hasIncomplete =
          nextKey !== null &&
          (item.episodeProgress?.[nextKey]?.watchedAt === undefined ||
            Object.keys(progress).length === 0);

        if (hasIncomplete && watchedDates.length > 0) {
          const anchor = watchedDates
            .map((iso) => toLocalDateKey(iso, ctx.timeZone))
            .sort()
            .at(-1)!;
          const candidate = makeCandidate(
            {
              domainId: "movie",
              itemId: item.id,
              kind: "continue_series",
              title: item.title,
              subtitle: nextKey ?? null,
              staleAnchorDate: anchor,
              deepLink: `/items/${item.id}`,
              primaryActionKey: "suggestions.action.open",
              minStaleDays: 14,
            },
            ctx.calendarDay,
          );
          if (candidate) candidates.push(candidate);
          continue;
        }

        if (item.status === "to_watch" && Object.keys(progress).length === 0) {
          const statusAt = item.fieldsUpdatedAt.status ?? item.createdAt;
          const anchor = toLocalDateKey(statusAt, ctx.timeZone);
          const candidate = makeCandidate(
            {
              domainId: "movie",
              itemId: item.id,
              kind: "start_series",
              title: item.title,
              subtitle: null,
              staleAnchorDate: anchor,
              deepLink: `/items/${item.id}`,
              primaryActionKey: "suggestions.action.start",
              minStaleDays: 30,
            },
            ctx.calendarDay,
          );
          if (candidate) candidates.push(candidate);
        }
        continue;
      }

      if (item.status === "to_watch") {
        const statusAt = item.fieldsUpdatedAt.status ?? item.createdAt;
        const anchor = toLocalDateKey(statusAt, ctx.timeZone);
        const candidate = makeCandidate(
          {
            domainId: "movie",
            itemId: item.id,
            kind: "watch_film",
            title: item.title,
            subtitle: null,
            staleAnchorDate: anchor,
            deepLink: `/items/${item.id}`,
            primaryActionKey: "suggestions.action.open",
            minStaleDays: 30,
          },
          ctx.calendarDay,
        );
        if (candidate) candidates.push(candidate);
      }
    }

    return candidates;
  },
};
