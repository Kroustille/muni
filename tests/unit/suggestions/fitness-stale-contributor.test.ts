import { describe, expect, it } from "vitest";

import { fitnessStaleContributor } from "@/application/suggestions/contributors/fitness-stale-contributor";
import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import { CALENDAR_DAY, TZ, dateOnlyDaysAgo } from "./fixtures";

const TEMPLATE_ID = "11111111-1111-4111-8111-111111111101";
const SCHEDULED_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const template: FitnessSessionTemplate = {
  id: TEMPLATE_ID,
  title: "Push",
  sortOrder: 0,
  templateExercises: [],
  deletedAt: null,
  fieldsUpdatedAt: {},
};

describe("fitnessStaleContributor", () => {
  const ctx = { calendarDay: CALENDAR_DAY, timeZone: TZ };

  it("returns empty when fitness repos are missing", async () => {
    const candidates = await fitnessStaleContributor.listStaleCandidates({} as never, ctx);
    expect(candidates).toEqual([]);
  });

  it("emits resume_training when last completed workout is stale", async () => {
    const workouts: FitnessWorkoutLog[] = [
      {
        id: "22222222-2222-4222-8222-222222222202",
        status: "completed",
        calendarDate: dateOnlyDaysAgo(10),
        sessionTemplateId: TEMPLATE_ID,
        scheduledSessionId: SCHEDULED_ID,
        title: "Push",
        startedAt: dateOnlyDaysAgo(10) + "T08:00:00.000Z",
        completedAt: dateOnlyDaysAgo(10) + "T09:00:00.000Z",
        catalogVersion: 1,
        loggedExercises: [],
        recovery: null,
        deletedAt: null,
        fieldsUpdatedAt: {},
      },
    ];

    const deps = {
      fitnessSessionTemplates: {
        list: async () => [template],
      },
      fitnessWorkouts: {
        list: async () => workouts,
      },
      fitnessSkips: {
        list: async () => [] as FitnessSkipRecord[],
      },
    };

    const candidates = await fitnessStaleContributor.listStaleCandidates(deps as never, ctx);
    expect(candidates.some((c) => c.kind === "resume_training")).toBe(true);
  });

  it("emits unblock_skipped for skip records stale at least 3 days", async () => {
    const skips: FitnessSkipRecord[] = [
      {
        id: "33333333-3333-4333-8333-333333333303",
        calendarDate: dateOnlyDaysAgo(5),
        scheduledSessionId: SCHEDULED_ID,
        sessionTemplateId: TEMPLATE_ID,
        note: null,
        deletedAt: null,
        fieldsUpdatedAt: {},
      },
    ];

    const deps = {
      fitnessSessionTemplates: {
        list: async () => [template],
      },
      fitnessWorkouts: {
        list: async () => [] as FitnessWorkoutLog[],
      },
      fitnessSkips: {
        list: async () => skips,
      },
    };

    const candidates = await fitnessStaleContributor.listStaleCandidates(deps as never, ctx);
    expect(candidates.some((c) => c.kind === "unblock_skipped")).toBe(true);
    expect(candidates.find((c) => c.kind === "unblock_skipped")?.deepLink).toContain("/fitness/workout/");
  });
});
