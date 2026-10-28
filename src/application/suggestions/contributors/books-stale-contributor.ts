import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { bookActivityAnchor, makeCandidate } from "@/application/suggestions/contributors/shared";
import { fieldStampToLocalDateKey, toLocalDateKey } from "@/application/shared/activity-days";

export const booksStaleContributor: DomainStaleContributor = {
  domainId: "book",
  async listStaleCandidates(deps, ctx) {
    const items = await deps.items.query({ type: "book" });
    const candidates = [];

    for (const item of items) {
      if (item.deletedAt !== null || !item.title.trim()) continue;

      if (item.status === "reading" || item.status === "paused") {
        const anchor = bookActivityAnchor(item, ctx.timeZone);
        if (!anchor) continue;
        const candidate = makeCandidate(
          {
            domainId: "book",
            itemId: item.id,
            kind: "resume_reading",
            title: item.title,
            subtitle: null,
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

      if (item.status === "to_read") {
        const statusAt = item.fieldsUpdatedAt.status;
        const anchor = statusAt
          ? fieldStampToLocalDateKey(statusAt, ctx.timeZone)
          : toLocalDateKey(item.createdAt, ctx.timeZone);
        if (!anchor) continue;
          {
            domainId: "book",
            itemId: item.id,
            kind: "start_to_read",
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
    }

    return candidates;
  },
};
