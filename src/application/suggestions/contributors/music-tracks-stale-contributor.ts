import type { Item } from "@/domain/item";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";
import { fieldStampToLocalDateKey } from "@/application/shared/activity-days";

export const musicTracksStaleContributor: DomainStaleContributor = {
  domainId: "music_track",
  async listStaleCandidates(deps, ctx) {
    const items = await deps.items.query({ type: "music_track" });
    const candidates = [];

    for (const item of items) {
      if (item.deletedAt !== null || item.status !== "to_listen" || !item.title.trim()) {
        continue;
      }
      const statusAt = item.fieldsUpdatedAt.status ?? item.createdAt;
      const anchor = fieldStampToLocalDateKey(statusAt, ctx.timeZone);
      if (!anchor) continue;
      const candidate = makeCandidate(
        {
          domainId: "music_track",
          itemId: item.id,
          kind: "listen_backlog",
          title: item.title,
          subtitle: item.artist,
          staleAnchorDate: anchor,
          deepLink: `/items/${item.id}`,
          primaryActionKey: "suggestions.action.open",
          minStaleDays: 30,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  },
};

export function recipeCookedDates(item: Item): string[] {
  if (item.type !== "recipe") return [];
  const extended = item as Item & { cookedDates?: string[] | null };
  return extended.cookedDates ?? [];
}
