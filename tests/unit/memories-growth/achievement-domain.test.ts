import { describe, expect, it } from "vitest";

import {
  achievementToWire,
  mergeAchievement,
  validateAchievement,
  wireToAchievement,
} from "@/domain/achievement";
import { buildAchievement } from "./fixtures";

const TODAY = "2026-11-11";

describe("achievement domain", () => {
  it("accepts auto achievements with rule and threshold", () => {
    expect(validateAchievement(buildAchievement(), TODAY)).toBeNull();
  });

  it("requires rule and threshold for auto achievements", () => {
    expect(validateAchievement(buildAchievement({ ruleId: null }), TODAY)).toMatch(/rule/);
    expect(validateAchievement(buildAchievement({ threshold: null }), TODAY)).toMatch(/rule/);
  });

  it("accepts manual achievements without a rule", () => {
    expect(
      validateAchievement(
        buildAchievement({ origin: "manual", ruleId: null, ruleVersion: null, threshold: null }),
        TODAY,
      ),
    ).toBeNull();
  });

  it("rejects future earned dates and blank titles", () => {
    expect(validateAchievement(buildAchievement({ earnedOn: "2026-11-12" }), TODAY)).toMatch(
      /future/,
    );
    expect(validateAchievement(buildAchievement({ title: "" }), TODAY)).toMatch(/title/);
  });

  it("round-trips and keeps celebratedAt once set", () => {
    const achievement = buildAchievement({ fieldsUpdatedAt: { celebratedAt: "1-0-a" } });
    expect(wireToAchievement(achievementToWire(achievement))).toEqual(achievement);

    const local = achievementToWire(achievement);
    const remote = achievementToWire({
      ...achievement,
      celebratedAt: "2026-11-11T09:00:00.000Z",
      fieldsUpdatedAt: { celebratedAt: "2-0-b" },
    });
    expect(mergeAchievement(local, remote).celebrated_at).toBe("2026-11-11T09:00:00.000Z");
  });
});
