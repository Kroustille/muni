import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  defaultRecapPeriod,
  navigatePeriod,
  resolvePeriodBounds,
  setPeriodGranularity,
} from "@/application/recap/period";

describe("recap period math", () => {
  const tz = "Europe/Paris";

  it("resolves ISO week Monday–Sunday", () => {
    const period = { granularity: "week" as const, anchorDate: "2026-10-28", timeZone: tz };
    const resolved = resolvePeriodBounds(period);
    expect(resolved.startDate).toBe("2026-10-26");
    expect(resolved.endDate).toBe("2026-11-01");
  });

  it("resolves calendar month bounds", () => {
    const resolved = resolvePeriodBounds({
      granularity: "month",
      anchorDate: "2026-02-15",
      timeZone: tz,
    });
    expect(resolved.startDate).toBe("2026-02-01");
    expect(resolved.endDate).toBe("2026-02-28");
  });

  it("resolves single day", () => {
    const resolved = resolvePeriodBounds({
      granularity: "day",
      anchorDate: "2026-07-04",
      timeZone: tz,
    });
    expect(resolved.startDate).toBe("2026-07-04");
    expect(resolved.endDate).toBe("2026-07-04");
  });

  it("resolves calendar year", () => {
    const resolved = resolvePeriodBounds({
      granularity: "year",
      anchorDate: "2026-06-01",
      timeZone: tz,
    });
    expect(resolved.startDate).toBe("2026-01-01");
    expect(resolved.endDate).toBe("2026-12-31");
  });

  it("navigates prev/next week", () => {
    const start = defaultRecapPeriod(tz);
    const next = navigatePeriod({ ...start, anchorDate: "2026-10-01" }, "next");
    expect(next.anchorDate).toBe("2026-10-08");
    const prev = navigatePeriod(next, "prev");
    expect(prev.anchorDate).toBe("2026-10-01");
  });

  it("navigates daily bounds", () => {
    const day = { granularity: "day" as const, anchorDate: "2026-05-10", timeZone: tz };
    expect(navigatePeriod(day, "next").anchorDate).toBe("2026-05-11");
    expect(navigatePeriod(day, "prev").anchorDate).toBe("2026-05-09");
  });

  it("setPeriodGranularity anchors year on Jan 1", () => {
    const next = setPeriodGranularity("2026-08-12", "year", tz);
    expect(next.granularity).toBe("year");
    expect(next.anchorDate).toBe("2026-01-01");
  });

  it("addCalendarDays steps correctly", () => {
    expect(addCalendarDays("2026-01-01", 364)).toBe("2026-12-31");
  });
});
