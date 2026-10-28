import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

export const recipesRecapContributor: DomainRecapContributor = {
  domainId: "recipe",
  async collectAchievements(deps, range) {
    const items = await deps.items.query({ type: "recipe" });
    const achievements: RecapAchievement[] = [];
    for (const item of items) {
      if (item.deletedAt != null || item.type !== "recipe") continue;
      const dates = item.cookedDates ?? [];
      for (const cookedOn of dates) {
        if (!recapDateInRange(cookedOn, range.startDate, range.endDate)) continue;
        achievements.push({
          domainId: "recipe",
          occurredOn: cookedOn,
          sortInstant: `${cookedOn}T12:00:00.000Z`,
          title: item.title,
          sourceItemId: item.id,
          deepLinkHref: `/items/${item.id}`,
        });
      }
    }
    return achievements;
  },
};
