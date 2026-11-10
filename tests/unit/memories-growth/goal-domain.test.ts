import { describe, expect, it } from "vitest";

import {
  goalCheckinToWire,
  goalToWire,
  periodForPreset,
  validateGoal,
  validateGoalCheckin,
  wireToGoal,
  wireToGoalCheckin,
} from "@/domain/goal";
import { buildGoal, buildGoalCheckin } from "./fixtures";

const TODAY = "2026-11-11";

describe("goal periods", () => {
  it("computes Monday–Sunday weeks", () => {
    expect(periodForPreset("week", "2026-11-11")).toEqual({
      startDate: "2026-11-09",
      endDate: "2026-11-15",
    });
    expect(periodForPreset("week", "2026-11-09")).toEqual({
      startDate: "2026-11-09",
      endDate: "2026-11-15",
    });
    expect(periodForPreset("week", "2026-11-15")).toEqual({
      startDate: "2026-11-09",
      endDate: "2026-11-15",
    });
  });

  it("computes months including leap February", () => {
    expect(periodForPreset("month", "2028-02-10")).toEqual({
      startDate: "2028-02-01",
      endDate: "2028-02-29",
    });
  });

  it("computes quarters and years", () => {
    expect(periodForPreset("quarter", "2026-11-11")).toEqual({
      startDate: "2026-10-01",
      endDate: "2026-12-31",
    });
    expect(periodForPreset("year", "2026-11-11")).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
  });
});

describe("goal validation", () => {
  it("accepts a measurable goal", () => {
    expect(validateGoal(buildGoal())).toBeNull();
  });

  it("requires metric and target for domain_count", () => {
    expect(validateGoal(buildGoal({ metric: null }))).toMatch(/metric/);
    expect(validateGoal(buildGoal({ targetCount: null }))).toMatch(/target/);
    expect(validateGoal(buildGoal({ targetCount: 0 }))).toMatch(/target/);
  });

  it("requires a target for check-in goals but no metric", () => {
    expect(
      validateGoal(buildGoal({ targetKind: "checkin_count", metric: null, targetCount: 4 })),
    ).toBeNull();
    expect(
      validateGoal(buildGoal({ targetKind: "checkin_count", metric: "books", targetCount: 4 })),
    ).toMatch(/metric/);
  });

  it("allows done goals without metric or target", () => {
    expect(
      validateGoal(buildGoal({ targetKind: "done", metric: null, targetCount: null })),
    ).toBeNull();
  });

  it("rejects inverted or overlong periods", () => {
    expect(validateGoal(buildGoal({ startDate: "2026-12-01", endDate: "2026-11-01" }))).toMatch(
      /period/,
    );
    expect(validateGoal(buildGoal({ startDate: "2020-01-01", endDate: "2026-01-01" }))).toMatch(
      /period/,
    );
  });

  it("rejects blank titles", () => {
    expect(validateGoal(buildGoal({ title: " " }))).toMatch(/title/);
  });

  it("round-trips goal and check-in wire formats", () => {
    const goal = buildGoal({ fieldsUpdatedAt: { targetCount: "1-0-a" } });
    expect(goalToWire(goal).fields_updated_at).toEqual({ target_count: "1-0-a" });
    expect(wireToGoal(goalToWire(goal))).toEqual(goal);
    const checkin = buildGoalCheckin();
    expect(wireToGoalCheckin(goalCheckinToWire(checkin))).toEqual(checkin);
  });
});

describe("check-in validation", () => {
  it("rejects future dates and long notes", () => {
    expect(validateGoalCheckin(buildGoalCheckin({ occurredOn: TODAY }), TODAY)).toBeNull();
    expect(validateGoalCheckin(buildGoalCheckin({ occurredOn: "2026-11-12" }), TODAY)).toMatch(
      /future/,
    );
    expect(validateGoalCheckin(buildGoalCheckin({ note: "x".repeat(1001) }), TODAY)).not.toBeNull();
  });
});
