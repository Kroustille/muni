import {
  orderDomainsPresent,
  type RecapActivityDay,
  type RecapAchievement,
} from "@/domain/recap";
import { addCalendarDays, localTodayDateKey } from "@/application/recap/period";

export function buildActivityDays(
  achievements: readonly RecapAchievement[],
  todayDateKey: string = localTodayDateKey(),
): RecapActivityDay[] {
  const windowStart = addCalendarDays(todayDateKey, -364);
  const byDate = new Map<string, RecapAchievement[]>();

  for (const achievement of achievements) {
    if (achievement.occurredOn < windowStart || achievement.occurredOn > todayDateKey) continue;
    const list = byDate.get(achievement.occurredOn) ?? [];
    list.push(achievement);
    byDate.set(achievement.occurredOn, list);
  }

  const days: RecapActivityDay[] = [];
  for (let i = 0; i < 365; i += 1) {
    const calendarDate = addCalendarDays(windowStart, i);
    const dayAchievements = byDate.get(calendarDate) ?? [];
    const domainsPresent = orderDomainsPresent(dayAchievements.map((a) => a.domainId));
    days.push({
      calendarDate,
      domainsPresent,
      eventCount: dayAchievements.length,
      isActive: domainsPresent.length > 0,
    });
  }
  return days;
}
