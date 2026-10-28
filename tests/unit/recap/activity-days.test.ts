import { describe, expect, it } from "vitest";

import { buildActivityDays } from "@/application/recap/recap-activity-days";
import type { RecapAchievement } from "@/domain/recap";

describe("buildActivityDays", () => {
  const sampleAchievements = (today: string): RecapAchievement[] => [
    {
      domainId: "book",
      occurredOn: today,
      sortInstant: "2026-10-28T10:00:00.000Z",
      title: "Book",
    },
    {
      domainId: "music_track",
      occurredOn: today,
      sortInstant: "2026-10-28T11:00:00.000Z",
      title: "Track",
      musicLineKind: "listened",
    },
    {
      domainId: "music_track",
      occurredOn: today,
      sortInstant: "2026-10-28T12:00:00.000Z",
      title: "Practice",
      musicLineKind: "practice_session",
    },
    {
      domainId: "fitness",
      occurredOn: today,
      sortInstant: "2026-10-28T13:00:00.000Z",
      title: "Workout",
    },
  ];

  it("returns 365 days ending today with multi-domain dedupe (wide window)", () => {
    const today = "2026-10-28";
    const days = buildActivityDays(sampleAchievements(today), today, "365");
    expect(days).toHaveLength(365);
    expect(days[0].calendarDate).toBe("2025-10-29");
    expect(days[364].calendarDate).toBe(today);
    const active = days.find((day) => day.calendarDate === today);
    expect(active?.domainsPresent).toEqual(["book", "music_track", "fitness"]);
    expect(active?.eventCount).toBe(4);
  });

  it("returns 84 days ending today (narrow window)", () => {
    const today = "2026-10-28";
    const days = buildActivityDays(sampleAchievements(today), today, "84");
    expect(days).toHaveLength(84);
    expect(days[0].calendarDate).toBe("2026-08-06");
    expect(days[83].calendarDate).toBe(today);
  });

  it("drops achievements outside the narrow window", () => {
    const today = "2026-10-28";
    const achievements: RecapAchievement[] = [
      {
        domainId: "book",
        occurredOn: "2026-08-05",
        sortInstant: "2026-08-05T10:00:00.000Z",
        title: "Old",
      },
      {
        domainId: "book",
        occurredOn: "2026-08-06",
        sortInstant: "2026-08-06T10:00:00.000Z",
        title: "In window",
      },
    ];
    const days = buildActivityDays(achievements, today, "84");
    expect(days.some((d) => d.calendarDate === "2026-08-05")).toBe(false);
    expect(days.find((d) => d.calendarDate === "2026-08-06")?.isActive).toBe(true);
  });
});
