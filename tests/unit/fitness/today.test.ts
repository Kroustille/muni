import { describe, expect, it } from "vitest";

import { localCalendarDate, resolveTodayScheduledSessions } from "@/application/fitness/today";
import { buildWeekAdherenceView } from "@/domain/fitness/adherence";
import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "@/domain/fitness/workout-log";

const TEMPLATE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHEDULED_ID = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const WORKOUT_ID = "cccccccc-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const template: FitnessSessionTemplate = {
  id: TEMPLATE_ID,
  title: "Push",
  sortOrder: 0,
  templateExercises: [],
  deletedAt: null,
  fieldsUpdatedAt: {},
};

describe("today session resolution", () => {
  it("returns scheduled sessions for calendar day", () => {
    const today = localCalendarDate();
    const scheduled: FitnessScheduledSession = {
      id: SCHEDULED_ID,
      calendarDate: today,
      sessionTemplateId: TEMPLATE_ID,
      sortOrder: 0,
      titleSnapshot: null,
      templateExercisesSnapshot: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const sessions = resolveTodayScheduledSessions([scheduled], [template], [], [], today);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.title).toBe("Push");
  });

  it("keeps completed session visible after template soft-delete", () => {
    const today = localCalendarDate();
    const scheduled: FitnessScheduledSession = {
      id: SCHEDULED_ID,
      calendarDate: today,
      sessionTemplateId: TEMPLATE_ID,
      sortOrder: 0,
      titleSnapshot: "Push archivé",
      templateExercisesSnapshot: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const completedLog: FitnessWorkoutLog = {
      id: WORKOUT_ID,
      status: "completed",
      calendarDate: today,
      sessionTemplateId: TEMPLATE_ID,
      scheduledSessionId: SCHEDULED_ID,
      title: "Push du matin",
      startedAt: `${today}T08:00:00.000Z`,
      completedAt: `${today}T09:00:00.000Z`,
      catalogVersion: 1,
      loggedExercises: [],
      recovery: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const deletedTemplate: FitnessSessionTemplate = {
      ...template,
      deletedAt: `${today}T10:00:00.000Z`,
    };
    const sessions = resolveTodayScheduledSessions(
      [scheduled],
      [deletedTemplate],
      [completedLog],
      [],
      today,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.status).toBe("done");
    expect(sessions[0]?.title).toBe("Push du matin");
    expect(sessions[0]?.template).toBeNull();

    const week = buildWeekAdherenceView([scheduled], [deletedTemplate], [completedLog], [], today);
    expect(week.completedCount).toBe(1);
    expect(week.sessions[0]?.title).toBe("Push du matin");
  });

  it("keeps skipped session visible after template soft-delete", () => {
    const today = localCalendarDate();
    const scheduled: FitnessScheduledSession = {
      id: SCHEDULED_ID,
      calendarDate: today,
      sessionTemplateId: TEMPLATE_ID,
      sortOrder: 0,
      titleSnapshot: "Push",
      templateExercisesSnapshot: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const skip: FitnessSkipRecord = {
      id: "dddddddd-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      calendarDate: today,
      scheduledSessionId: SCHEDULED_ID,
      sessionTemplateId: TEMPLATE_ID,
      titleSnapshot: "Push",
      note: null,
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const deletedTemplate: FitnessSessionTemplate = {
      ...template,
      deletedAt: `${today}T10:00:00.000Z`,
    };
    const sessions = resolveTodayScheduledSessions(
      [scheduled],
      [deletedTemplate],
      [],
      [skip],
      today,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.status).toBe("skipped");
    expect(sessions[0]?.title).toBe("Push");
  });
});
