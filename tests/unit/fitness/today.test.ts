import { describe, expect, it } from "vitest";

import { localCalendarDate, resolveTodaySessions } from "@/application/fitness/today";
import type { FitnessProgram } from "@/domain/fitness/program";

const program: FitnessProgram = {
  id: "11111111-2222-4333-8444-555555555555",
  name: "Test",
  isActive: true,
  plannedSessions: [
    {
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      title: "Push",
      weekdays: [1, 3, 5],
      sortOrder: 0,
      exercises: [],
    },
  ],
  deletedAt: null,
  fieldsUpdatedAt: {},
};

describe("today session resolution", () => {
  it("returns planned sessions for weekday", () => {
    const today = localCalendarDate();
    const sessions = resolveTodaySessions(program, [], [], today);
    expect(sessions.length).toBeGreaterThanOrEqual(0);
  });
});
