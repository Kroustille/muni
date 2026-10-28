import { describe, expect, it } from "vitest";

import { validatePushMusicPractice } from "@/application/server/music-practice-sync-service";
import { djSetToWire } from "@/domain/dj-set";
import { musicCompositionToWire } from "@/domain/music-composition";
import { buildDjSet, buildMusicComposition } from "./fixtures";

describe("validatePushMusicPractice", () => {
  it("rejects invalid finished composition", () => {
    const badComposition = musicCompositionToWire(
      buildMusicComposition({ status: "finished", finishedAt: null }),
    );
    expect(() =>
      validatePushMusicPractice({
        compositions: [badComposition],
        djSets: [],
        instruments: [],
        exercises: [],
        plans: [],
        logs: [],
        learningPieces: [],
      }),
    ).toThrow();
  });

  it("rejects performed dj set without performedAt", () => {
    const bad = djSetToWire(buildDjSet({ status: "performed", performedAt: null }));
    expect(() =>
      validatePushMusicPractice({
        compositions: [],
        djSets: [bad],
        instruments: [],
        exercises: [],
        plans: [],
        logs: [],
        learningPieces: [],
      }),
    ).toThrow();
  });

  it("rejects user_id in push body", () => {
    const wire = musicCompositionToWire(buildMusicComposition());
    expect(() =>
      validatePushMusicPractice({
        compositions: [{ ...wire, user_id: "bad" } as typeof wire],
        djSets: [],
        instruments: [],
        exercises: [],
        plans: [],
        logs: [],
        learningPieces: [],
      }),
    ).toThrow();
  });

  it("accepts valid composition batch", () => {
    const wire = musicCompositionToWire(buildMusicComposition());
    const validated = validatePushMusicPractice({
      compositions: [wire],
      djSets: [],
      instruments: [],
      exercises: [],
      plans: [],
      logs: [],
      learningPieces: [],
    });
    expect(validated.compositions[0]?.title).toBe(wire.title);
  });

  it("rejects invalid wire rows for each entity family", () => {
    expect(() =>
      validatePushMusicPractice({
        compositions: [null],
        djSets: [],
        instruments: [],
        exercises: [],
        plans: [],
        logs: [],
        learningPieces: [],
      }),
    ).toThrow();
    const composition = musicCompositionToWire(buildMusicComposition());
    expect(() =>
      validatePushMusicPractice({
        compositions: [],
        djSets: [{ ...djSetToWire(buildDjSet()), title: "" }],
        instruments: [],
        exercises: [],
        plans: [],
        logs: [],
        learningPieces: [],
      }),
    ).toThrow();
    expect(() =>
      validatePushMusicPractice({
        compositions: [],
        djSets: [],
        instruments: [{ user_id: "x", ...composition } as never],
        exercises: [],
        plans: [],
        logs: [],
        learningPieces: [],
      }),
    ).toThrow();
  });
});
