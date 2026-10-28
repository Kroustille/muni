import { toLocalDateKey } from "@/application/shared/activity-days";
import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

export const musicTracksRecapContributor: DomainRecapContributor = {
  domainId: "music_track",
  async collectAchievements(deps, range) {
    const items = await deps.items.query({ type: "music_track" });
    const achievements: RecapAchievement[] = [];
    for (const item of items) {
      if (item.deletedAt != null || item.type !== "music_track") continue;
      if (item.status !== "listened") continue;
      const instant =
        item.fieldsUpdatedAt.status ??
        item.fieldsUpdatedAt.listened ??
        item.createdAt;
      const occurredOn = toLocalDateKey(instant, range.timeZone);
      if (!recapDateInRange(occurredOn, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "music_track",
        occurredOn,
        sortInstant: instant,
        title: item.title,
        subtitle: "Écouté",
        musicLineKind: "listened",
        sourceItemId: item.id,
        deepLinkHref: `/items/${item.id}`,
      });
    }
    return achievements;
  },
};
