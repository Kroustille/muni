import {
  orderDomainsPresent,
  type RecapActivityDay,
  type RecapActivityViewportWindow,
  type RecapAchievement,
} from "@/domain/recap";
import { addCalendarDays, localTodayDateKey } from "@/application/recap/period";

export function recapActivityWindowDayCount(window: RecapActivityViewportWindow): number {
  return window === "84" ? 84 : 365;
}

export function recapActivityWindowStart(
  todayDateKey: string,
  window: RecapActivityViewportWindow,
): string {
  const dayCount = recapActivityWindowDayCount(window);
  return addCalendarDays(todayDateKey, -(dayCount - 1));
}

export function buildActivityDays(
  achievements: readonly RecapAchievement[],
  todayDateKey: string = localTodayDateKey(),
  viewportWindow: RecapActivityViewportWindow = "365",
): RecapActivityDay[] {
  const dayCount = recapActivityWindowDayCount(viewportWindow);
  const windowStart = recapActivityWindowStart(todayDateKey, viewportWindow);
  const byDate = new Map<string, RecapAchievement[]>();

  for (const achievement of achievements) {
    if (achievement.occurredOn < windowStart || achievement.occurredOn > todayDateKey) continue;
    const list = byDate.get(achievement.occurredOn) ?? [];
    list.push(achievement);
    byDate.set(achievement.occurredOn, list);
  }

  const days: RecapActivityDay[] = [];
  for (let i = 0; i < dayCount; i += 1) {
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
