import { describe, expect, it } from "vitest";

import { mergePlannedToPerformed, validateDjSet } from "@/domain/dj-set";
import {
  sortSessionNotesChronologically,
  validateMusicComposition,
} from "@/domain/music-composition";
import { buildDjSet, buildMusicComposition } from "./fixtures";

describe("music composition domain", () => {
  it("requires finishedAt when status is finished", () => {
    const composition = buildMusicComposition({ status: "finished", finishedAt: null });
    expect(validateMusicComposition(composition, "2026-01-15")).toBe(
      "finishedAt required when status is finished",
    );
  });

  it("rejects future finishedAt", () => {
    const composition = buildMusicComposition({
      status: "finished",
      finishedAt: "2099-01-01",
    });
    expect(validateMusicComposition(composition, "2026-01-15")).toBe("date cannot be in the future");
  });

  it("sorts session notes by date", () => {
    const sorted = sortSessionNotesChronologically([
      { date: "2026-02-01", text: "b" },
      { date: "2026-01-01", text: "a" },
    ]);
    expect(sorted.map((n) => n.date)).toEqual(["2026-01-01", "2026-02-01"]);
  });
});

describe("dj set domain", () => {
  it("requires performedAt when status is performed", () => {
    const djSet = buildDjSet({ status: "performed", performedAt: null });
    expect(validateDjSet(djSet, "2026-01-15")).toBe("performedAt required when status is performed");
  });

  it("mergePlannedToPerformed preserves setlist", () => {
    const planned = buildDjSet({
      setlist: [{ sortOrder: 0, text: "Track A" }],
    });
    const performed = mergePlannedToPerformed(planned, { performedAt: "2026-01-10" });
    expect(performed.status).toBe("performed");
    expect(performed.setlist).toEqual(planned.setlist);
    expect(performed.performedAt).toBe("2026-01-10");
  });
});
