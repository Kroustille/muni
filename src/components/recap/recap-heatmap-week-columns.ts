import type { RecapActivityDay } from "@/domain/recap";

/** ISO weekday index: Monday = 0 … Sunday = 6 */
export function isoWeekdayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return utcDay === 0 ? 6 : utcDay - 1;
}

/**
 * GitHub-style week columns: each column is one calendar week (Mon–Sun rows).
 * Padding cells are `null` (before first day / after last day in trailing window).
 */
export function buildRecapHeatmapWeekColumns(
  days: readonly RecapActivityDay[],
): (RecapActivityDay | null)[][] {
  if (days.length === 0) return [];

  const weeks: (RecapActivityDay | null)[][] = [];
  let week: (RecapActivityDay | null)[] = Array.from({ length: 7 }, () => null);
  let dayIndex = 0;

  const firstRow = isoWeekdayIndex(days[0].calendarDate);
  for (let row = firstRow; row < 7 && dayIndex < days.length; row += 1) {
    week[row] = days[dayIndex];
    dayIndex += 1;
  }
  weeks.push(week);

  while (dayIndex < days.length) {
    week = Array.from({ length: 7 }, () => null);
    for (let row = 0; row < 7 && dayIndex < days.length; row += 1) {
      week[row] = days[dayIndex];
      dayIndex += 1;
    }
    weeks.push(week);
  }

  return weeks;
}
