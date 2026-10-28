import {
  compareAchievements,
  RECAP_DOMAIN_IDS,
  RECAP_SECTION_LABEL_FR,
  type RecapAchievement,
  type RecapDomainId,
  type RecapSection,
  type RecapSnapshot,
  type RecapPeriod,
  DEFAULT_RECAP_TIMEZONE,
} from "@/domain/recap";
import type { RecapDeps } from "@/application/recap/contributor-types";
import { RECAP_CONTRIBUTORS } from "@/application/recap/contributors";
import { addCalendarDays, localTodayDateKey, resolvePeriodBounds } from "@/application/recap/period";
import { buildActivityDays } from "@/application/recap/recap-activity-days";

export { buildActivityDays };

export type BuildRecapSnapshotInput = {
  period: RecapPeriod;
  deps: RecapDeps;
  /** Override "today" for tests */
  todayDateKey?: string;
};

function groupSections(achievements: RecapAchievement[]): RecapSection[] {
  const byDomain = new Map<RecapDomainId, RecapAchievement[]>();
  for (const id of RECAP_DOMAIN_IDS) {
    byDomain.set(id, []);
  }
  for (const achievement of achievements) {
    byDomain.get(achievement.domainId)?.push(achievement);
  }

  const sections: RecapSection[] = [];
  for (const domainId of RECAP_DOMAIN_IDS) {
    const rows = byDomain.get(domainId) ?? [];
    rows.sort(compareAchievements);
    if (rows.length === 0) continue;
    sections.push({
      domainId,
      labelFr: RECAP_SECTION_LABEL_FR[domainId],
      count: rows.length,
      achievements: rows,
      visible: true,
    });
  }
  return sections;
}

export async function buildRecapSnapshot(input: BuildRecapSnapshotInput): Promise<RecapSnapshot> {
  const resolved = resolvePeriodBounds(input.period);
  const range = {
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    timeZone: resolved.timeZone,
  };

  const chunks = await Promise.all(
    RECAP_CONTRIBUTORS.map((contributor) => contributor.collectAchievements(input.deps, range)),
  );
  const periodAchievements = chunks.flat();
  const sections = groupSections(periodAchievements);
  const totalCount = periodAchievements.length;

  const today = input.todayDateKey ?? localTodayDateKey(resolved.timeZone);
  const allForHeatmap = await collectAllAchievementsForHeatmap(
    input.deps,
    today,
    resolved.timeZone,
  );

  return {
    period: resolved,
    sections,
    totalCount,
    activityDays: buildActivityDays(allForHeatmap, today),
    empty: totalCount === 0,
  };
}

async function collectAllAchievementsForHeatmap(
  deps: RecapDeps,
  todayDateKey: string,
  timeZone: string = DEFAULT_RECAP_TIMEZONE,
): Promise<RecapAchievement[]> {
  const windowStart = addCalendarDays(todayDateKey, -364);
  const heatmapRange = { startDate: windowStart, endDate: todayDateKey, timeZone };
  const chunks = await Promise.all(
    RECAP_CONTRIBUTORS.map((contributor) => contributor.collectAchievements(deps, heatmapRange)),
  );
  return chunks.flat();
}
