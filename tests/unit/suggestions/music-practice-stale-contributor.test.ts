import { describe, expect, it } from "vitest";

import { musicPracticeStaleContributor } from "@/application/suggestions/contributors/music-practice-stale-contributor";
import type {
  MusicPracticeCompositionRow,
  MusicPracticeDjSetRow,
  MusicPracticeLogRow,
  MusicPracticePlanRow,
} from "@/application/suggestions/build-daily-suggestions";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

describe("musicPracticeStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("returns empty when music practice ports are absent", async () => {
    const candidates = await musicPracticeStaleContributor.listStaleCandidates({} as never, ctx);
    expect(candidates).toEqual([]);
  });

  it("emits advance_composition, prepare_dj_set, and practice_session kinds", async () => {
    const compositions: MusicPracticeCompositionRow[] = [
      {
        id: "11111111-1111-4111-8111-111111111101",
        title: "Compo",
        status: "in_progress",
        deletedAt: null,
        statusUpdatedAt: dateOnlyDaysAgo(20) + "T10:00:00.000Z",
        lastSessionAt: null,
      },
    ];
    const djSets: MusicPracticeDjSetRow[] = [
      {
        id: "22222222-2222-4222-8222-222222222202",
        title: "Set",
        status: "planned",
        deletedAt: null,
        plannedDate: dateOnlyDaysAgo(20),
        performedAt: null,
        statusUpdatedAt: dateOnlyDaysAgo(20) + "T10:00:00.000Z",
      },
    ];
    const plans: MusicPracticePlanRow[] = [
      {
        id: "33333333-3333-4333-8333-333333333303",
        instrument: "Piano",
        active: true,
        startedAt: dateOnlyDaysAgo(30),
        deletedAt: null,
      },
    ];
    const logs: MusicPracticeLogRow[] = [
      {
        id: "44444444-4444-4444-8444-444444444404",
        planId: plans[0]!.id,
        practicedAt: dateOnlyDaysAgo(10) + "T10:00:00.000Z",
        deletedAt: null,
      },
    ];

    const deps = {
      musicPractice: {
        listCompositions: async () => compositions,
        listDjSets: async () => djSets,
        listPracticePlans: async () => plans,
        listPracticeLogs: async () => logs,
      },
    };

    const candidates = await musicPracticeStaleContributor.listStaleCandidates(deps as never, ctx);
    const kinds = candidates.map((c) => c.kind);
    expect(kinds).toContain("advance_composition");
    expect(kinds).toContain("prepare_dj_set");
    expect(kinds).toContain("practice_session");
  });
});
