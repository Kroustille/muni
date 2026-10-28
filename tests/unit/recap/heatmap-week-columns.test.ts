import { describe, expect, it } from "vitest";

import {
  buildRecapHeatmapWeekColumns,
  isoWeekdayIndex,
} from "@/components/recap/recap-heatmap-week-columns";
import type { RecapActivityDay } from "@/domain/recap";

function day(date: string, active = false): RecapActivityDay {
  return {
    calendarDate: date,
    domainsPresent: active ? ["book"] : [],
    eventCount: active ? 1 : 0,
    isActive: active,
  };
}

describe("isoWeekdayIndex", () => {
  it("uses ISO Monday = 0", () => {
    expect(isoWeekdayIndex("2026-10-26")).toBe(0); // Monday
    expect(isoWeekdayIndex("2026-11-01")).toBe(6); // Sunday
  });
});

describe("buildRecapHeatmapWeekColumns", () => {
  it("returns empty for no days", () => {
    expect(buildRecapHeatmapWeekColumns([])).toEqual([]);
  });

  it("pads the first week before the window start weekday", () => {
    const days = [day("2026-10-29"), day("2026-10-30")]; // Thu, Fri (ISO 3, 4)
    const weeks = buildRecapHeatmapWeekColumns(days);
    expect(weeks).toHaveLength(1);
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][1]).toBeNull();
    expect(weeks[0][2]).toBeNull();
    expect(weeks[0][3]?.calendarDate).toBe("2026-10-29");
    expect(weeks[0][4]?.calendarDate).toBe("2026-10-30");
  });

  it("adds a new column when a week spans more than seven days from start", () => {
    const days = Array.from({ length: 8 }, (_, i) =>
      day(`2026-10-${String(20 + i).padStart(2, "0")}`),
    );
    const weeks = buildRecapHeatmapWeekColumns(days);
    expect(weeks.length).toBeGreaterThanOrEqual(2);
    const flat = weeks.flat().filter(Boolean) as RecapActivityDay[];
    expect(flat).toHaveLength(8);
    expect(flat[0].calendarDate).toBe("2026-10-20");
    expect(flat[7].calendarDate).toBe("2026-10-27");
  });
});
