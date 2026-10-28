import { toLocalDateKey } from "@/application/shared/activity-days";
import type { Item } from "@/domain/item";
import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor, RecapDateRange, RecapDeps } from "@/application/recap/contributor-types";

function bookFinishedInstant(item: Item): string | null {
  if (item.type !== "book" || item.status !== "read") return null;
  return item.fieldsUpdatedAt.read ?? item.fieldsUpdatedAt.status ?? null;
}

export const booksRecapContributor: DomainRecapContributor = {
  domainId: "book",
  async collectAchievements(deps, range) {
    const items = await deps.items.query({ type: "book" });
    const achievements: RecapAchievement[] = [];
    for (const item of items) {
      if (item.deletedAt != null) continue;
      const instant = bookFinishedInstant(item);
      if (instant == null) continue;
      const occurredOn = toLocalDateKey(instant, range.timeZone);
      if (!recapDateInRange(occurredOn, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "book",
        occurredOn,
        sortInstant: instant,
        title: item.title,
        sourceItemId: item.id,
        deepLinkHref: `/items/${item.id}`,
      });
    }
    return achievements;
  },
};
