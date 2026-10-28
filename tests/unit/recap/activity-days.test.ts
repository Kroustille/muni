import { describe, expect, it } from "vitest";

import { buildActivityDays } from "@/application/recap/recap-activity-days";
import type { RecapAchievement } from "@/domain/recap";

describe("buildActivityDays", () => {
  it("returns 365 days ending today with multi-domain dedupe", () => {
    const today = "2026-10-28";
    const achievements: RecapAchievement[] = [
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
    const days = buildActivityDays(achievements, today);
    expect(days).toHaveLength(365);
    const active = days.find((day) => day.calendarDate === today);
    expect(active?.domainsPresent).toEqual(["book", "music_track", "fitness"]);
    expect(active?.eventCount).toBe(4);
  });
});
