import { describe, expect, it } from "vitest";

import { buildWeekAdherenceView, isoWeekdayFromCalendarDate } from "@/domain/fitness/adherence";
import { derivePersonalRecords, isPersonalRecordOnSave } from "@/domain/fitness/progression";
import type { FitnessProgram } from "@/domain/fitness/program";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";

const baseLog = (overrides: Partial<FitnessWorkoutLog>): FitnessWorkoutLog => ({
  id: overrides.id ?? "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  status: "completed",
  calendarDate: "2026-10-13",
  plannedSessionId: null,
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
    const program: FitnessProgram = {
      id: "11111111-2222-4333-8444-555555555555",
      name: "PPL",
      isActive: true,
      plannedSessions: [
        {
          id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          title: "Lundi",
          weekdays: [1],
          sortOrder: 0,
          exercises: [],
        },
      ],
      deletedAt: null,
      fieldsUpdatedAt: {},
    };
    const monday = "2026-10-12";
    expect(isoWeekdayFromCalendarDate(monday)).toBe(1);
    const view = buildWeekAdherenceView(program, [], [], monday);
    expect(view.plannedCount).toBeGreaterThanOrEqual(1);
    expect(view.completedCount).toBe(0);
  });
});
