import { describe, expect, it } from "vitest";

import { localCalendarDate, resolveTodayScheduledSessions } from "@/application/fitness/today";
import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";

const TEMPLATE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHEDULED_ID = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee";

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
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const sessions = resolveTodayScheduledSessions([scheduled], [template], [], [], today);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.template.title).toBe("Push");
  });
});
