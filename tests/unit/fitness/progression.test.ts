import { describe, expect, it } from "vitest";

import { buildWeekAdherenceView, isoWeekdayFromCalendarDate } from "@/domain/fitness/adherence";
import { derivePersonalRecords, isPersonalRecordOnSave } from "@/domain/fitness/progression";
import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";
import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";

const baseLog = (overrides: Partial<FitnessWorkoutLog>): FitnessWorkoutLog => ({
  id: overrides.id ?? "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  status: "completed",
  calendarDate: "2026-10-13",
  sessionTemplateId: null,
  scheduledSessionId: null,
  title: "Test",
  startedAt: "2026-10-13T10:00:00.000Z",
  completedAt: "2026-10-13T11:00:00.000Z",
  catalogVersion: 1,
  loggedExercises: [],
  recovery: null,
  deletedAt: null,
  fieldsUpdatedAt: {},
  ...overrides,
});

describe("fitness progression and adherence", () => {
  it("derives max charge PR", () => {
    const logs = [
      baseLog({
        loggedExercises: [
          {
            exerciseId: "squat",
            nameFrSnapshot: "Squat",
            sets: [{ chargeKg: 80, reps: 5 }],
          },
        ],
      }),
      baseLog({
        id: "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        calendarDate: "2026-10-15",
        loggedExercises: [
          {
            exerciseId: "squat",
            nameFrSnapshot: "Squat",
            sets: [{ chargeKg: 90, reps: 3 }],
          },
        ],
      }),
    ];
    const prs = derivePersonalRecords(logs);
    expect(prs.get("squat")?.maxChargeKg).toBe(90);
  });

  it("detects PR on save", () => {
    const prior = [
      baseLog({
        loggedExercises: [
          { exerciseId: "squat", nameFrSnapshot: "Squat", sets: [{ chargeKg: 80 }] },
        ],
      }),
    ];
    expect(isPersonalRecordOnSave(prior, "squat", [{ chargeKg: 85 }])).toBe(true);
    expect(isPersonalRecordOnSave(prior, "squat", [{ chargeKg: 75 }])).toBe(false);
  });

  it("builds week adherence counts", () => {
    const templateId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const scheduledId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const templates: FitnessSessionTemplate[] = [
      {
        id: templateId,
        title: "Lundi",
        sortOrder: 0,
        templateExercises: [],
        deletedAt: null,
        fieldsUpdatedAt: {},
      },
    ];
    const monday = "2026-10-12";
    const scheduled: FitnessScheduledSession[] = [
      {
        id: scheduledId,
        calendarDate: monday,
        sessionTemplateId: templateId,
        sortOrder: 0,
        titleSnapshot: null,
        templateExercisesSnapshot: null,
        deletedAt: null,
        fieldsUpdatedAt: {},
      },
    ];
    expect(isoWeekdayFromCalendarDate(monday)).toBe(1);
    const view = buildWeekAdherenceView(scheduled, templates, [], [], monday);
    expect(view.plannedCount).toBe(1);
    expect(view.completedCount).toBe(0);
  });
});
