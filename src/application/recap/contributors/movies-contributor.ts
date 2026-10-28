import { fieldStampToLocalDateKey, fieldStampToSortInstant } from "@/application/shared/activity-days";
import type { Item } from "@/domain/item";
import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

function pushIfInRange(
  achievements: RecapAchievement[],
  range: { startDate: string; endDate: string; timeZone: string },
  item: Item,
  occurredOn: string,
  sortInstant: string,
  subtitle?: string,
): void {
  if (!recapDateInRange(occurredOn, range.startDate, range.endDate)) return;
  achievements.push({
    domainId: "movie",
    occurredOn,
    sortInstant,
    title: item.title,
    subtitle,
    sourceItemId: item.id,
    deepLinkHref: `/items/${item.id}`,
  });
}

export const moviesRecapContributor: DomainRecapContributor = {
  domainId: "movie",
  async collectAchievements(deps, range) {
    const items = await deps.items.query({ type: "movie" });
    const achievements: RecapAchievement[] = [];
    for (const item of items) {
      if (item.deletedAt != null || item.type !== "movie") continue;

      if (item.watchedAt) {
        pushIfInRange(achievements, range, item, item.watchedAt, item.watchedAt);
      }

      if (item.status === "watched") {
        const watchedStamp = item.fieldsUpdatedAt.watched ?? item.fieldsUpdatedAt.status;
        if (watchedStamp) {
          const day = fieldStampToLocalDateKey(watchedStamp, range.timeZone);
          if (day == null) continue;
          pushIfInRange(
            achievements,
            range,
            item,
            day,
            fieldStampToSortInstant(watchedStamp),
          );
        }
      }

      if (item.episodeProgress) {
        for (const [key, entry] of Object.entries(item.episodeProgress)) {
          if (!entry.watchedAt) continue;
          pushIfInRange(
            achievements,
            range,
            item,
            entry.watchedAt,
            entry.watchedAt,
            key.replace(/^S(\d+)E(\d+)$/i, "S$1E$2"),
          );
        }
      }
    }
    return achievements;
  },
};
