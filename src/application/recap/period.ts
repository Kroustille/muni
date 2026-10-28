import {
  DEFAULT_RECAP_TIMEZONE,
  type RecapPeriodGranularity,
  type RecapPeriod,
  type RecapPeriodResolved,
} from "@/domain/recap";

function parseLocalDate(dateKey: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { y, m, d };
}

function formatLocalDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addCalendarDays(dateKey: string, delta: number): string {
  const { y, m, d } = parseLocalDate(dateKey);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return formatLocalDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function isoWeekBounds(anchorDate: string): { start: string; end: string } {
  const { y, m, d } = parseLocalDate(anchorDate);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const isoDow = dow === 0 ? 7 : dow;
  const monday = addCalendarDays(anchorDate, -(isoDow - 1));
  const sunday = addCalendarDays(monday, 6);
  return { start: monday, end: sunday };
}

function monthBounds(anchorDate: string): { start: string; end: string } {
  const { y, m } = parseLocalDate(anchorDate);
  const lastDay = daysInMonth(y, m);
  return { start: formatLocalDate(y, m, 1), end: formatLocalDate(y, m, lastDay) };
}

function yearBounds(anchorDate: string): { start: string; end: string } {
  const { y } = parseLocalDate(anchorDate);
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

const MONTH_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

function formatDayLabelFr(dateKey: string): string {
  const { y, m, d } = parseLocalDate(dateKey);
  return `${d} ${MONTH_FR[m - 1]} ${y}`;
}

function formatMonthLabelFr(anchorDate: string): string {
  const { y, m } = parseLocalDate(anchorDate);
  const month = MONTH_FR[m - 1];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${y}`;
}

export function localTodayDateKey(timeZone: string = DEFAULT_RECAP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function recapDateInRange(dateKey: string, start: string, end: string): boolean {
  return dateKey >= start && dateKey <= end;
}

export function resolvePeriodBounds(period: RecapPeriod): RecapPeriodResolved {
  let startDate: string;
  let endDate: string;
  let labelFr: string;

  switch (period.granularity) {
    case "day":
      startDate = period.anchorDate;
      endDate = period.anchorDate;
      labelFr = formatDayLabelFr(period.anchorDate);
      break;
    case "week": {
      const bounds = isoWeekBounds(period.anchorDate);
      startDate = bounds.start;
      endDate = bounds.end;
      labelFr = `Semaine du ${formatDayLabelFr(bounds.start)}`;
      break;
    }
    case "month": {
      const bounds = monthBounds(period.anchorDate);
      startDate = bounds.start;
      endDate = bounds.end;
      labelFr = formatMonthLabelFr(period.anchorDate);
      break;
    }
    case "year": {
      const bounds = yearBounds(period.anchorDate);
      startDate = bounds.start;
      endDate = bounds.end;
      labelFr = `Année ${parseLocalDate(period.anchorDate).y}`;
      break;
    }
  }

  return { ...period, startDate, endDate, labelFr };
}

export function defaultRecapPeriod(timeZone: string = DEFAULT_RECAP_TIMEZONE): RecapPeriod {
  return {
    granularity: "week",
    anchorDate: localTodayDateKey(timeZone),
    timeZone,
  };
}

export function navigatePeriod(period: RecapPeriod, direction: "prev" | "next"): RecapPeriod {
  const delta = direction === "next" ? 1 : -1;
  switch (period.granularity) {
    case "day":
      return { ...period, anchorDate: addCalendarDays(period.anchorDate, delta) };
    case "week":
      return { ...period, anchorDate: addCalendarDays(period.anchorDate, delta * 7) };
    case "month": {
      const { y, m, d } = parseLocalDate(period.anchorDate);
      const targetMonth = m + delta;
      const ny = y + Math.floor((targetMonth - 1) / 12);
      const nm = ((targetMonth - 1 + 1200) % 12) + 1;
      const clampedDay = Math.min(d, daysInMonth(ny, nm));
      return { ...period, anchorDate: formatLocalDate(ny, nm, clampedDay) };
    }
    case "year": {
      const { y, m, d } = parseLocalDate(period.anchorDate);
      return { ...period, anchorDate: formatLocalDate(y + delta, m, d) };
    }
  }
}

export function setPeriodGranularity(
  anchorDate: string,
  granularity: RecapPeriodGranularity,
  timeZone: string = DEFAULT_RECAP_TIMEZONE,
): RecapPeriod {
  if (granularity === "year") {
    const y = parseLocalDate(anchorDate).y;
    return { granularity, anchorDate: `${y}-01-01`, timeZone };
  }
  const today = localTodayDateKey(timeZone);
  return {
    granularity,
    anchorDate: granularity === "day" ? anchorDate : today,
    timeZone,
  };
}

export function monthLabelForAchievement(dateKey: string): string {
  const { m } = parseLocalDate(dateKey);
  const month = MONTH_FR[m - 1];
  return month.charAt(0).toUpperCase() + month.slice(1);
}
