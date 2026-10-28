import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

export const plantsRecapContributor: DomainRecapContributor = {
  domainId: "plants",
  async collectAchievements(deps, range) {
    const [careEvents, milestones] = await Promise.all([
      deps.plants.listCareEventsInRange(range.startDate, range.endDate),
      deps.plants.listMilestonesInRange(range.startDate, range.endDate),
    ]);
    const achievements: RecapAchievement[] = [];

    for (const row of careEvents) {
      if (row.parentDeleted) continue;
      if (!recapDateInRange(row.occurredAt, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "plants",
        occurredOn: row.occurredAt,
        sortInstant: `${row.occurredAt}T12:00:00.000Z`,
        title: row.title,
        subtitle: row.subtitleKey,
        sourcePlantCareEventId: row.id,
      });
    }

    for (const row of milestones) {
      if (row.parentDeleted) continue;
      if (!recapDateInRange(row.occurredAt, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "plants",
        occurredOn: row.occurredAt,
        sortInstant: `${row.occurredAt}T12:00:00.000Z`,
        title: row.title,
        subtitle: row.subtitleKey,
        sourceVegetableMilestoneId: row.id,
      });
    }

    return achievements;
  },
};
