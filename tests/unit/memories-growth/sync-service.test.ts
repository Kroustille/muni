import { describe, expect, it } from "vitest";

import {
  pullCursor,
  validatePushMemoriesGrowth,
} from "@/application/server/memories-growth-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";
import { goalToWire } from "@/domain/goal";
import { souvenirToWire } from "@/domain/souvenir";
import { buildGoal, buildSouvenir } from "./fixtures";

const row = (stamp: string) => ({ server_updated_at: stamp });

describe("pullCursor", () => {
  it("uses the latest stamp when no table returned a full page", () => {
    expect(
      pullCursor([[row("2026-01-01T00:00:01Z")], [row("2026-01-01T00:00:03Z")]], 2, null),
    ).toEqual({
      cursor: "2026-01-01T00:00:03Z",
      hasMore: false,
    });
  });

  it("does not pass the end of a full page in another table", () => {
    const fullSouvenirs = [row("2026-01-01T00:00:01Z"), row("2026-01-01T00:00:02Z")];
    const goals = [row("2026-01-01T00:00:09Z")];
    expect(pullCursor([fullSouvenirs, goals], 2, null)).toEqual({
      cursor: "2026-01-01T00:00:02Z",
      hasMore: true,
    });
  });

  it("keeps the previous cursor when nothing changed", () => {
    expect(pullCursor([[], []], 100, "2026-01-01T00:00:00Z")).toEqual({
      cursor: "2026-01-01T00:00:00Z",
      hasMore: false,
    });
  });
});

describe("validatePushMemoriesGrowth", () => {
  it("accepts valid rows and treats missing keys as empty", () => {
    const souvenir = souvenirToWire(buildSouvenir());
    expect(validatePushMemoriesGrowth({ souvenirs: [souvenir] })).toEqual({
      souvenirs: [souvenir],
      goals: [],
      goalCheckins: [],
      achievements: [],
    });
  });

  it("reports row errors with index and id", () => {
    const blank = souvenirToWire(buildSouvenir({ title: "  " }));
    try {
      validatePushMemoriesGrowth({ souvenirs: [souvenirToWire(buildSouvenir()), blank] });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SyncValidationError);
      expect((error as SyncValidationError).rowErrors[0]).toMatchObject({ index: 1, id: blank.id });
    }
  });

  it("applies cross-field goal rules", () => {
    expect(() =>
      validatePushMemoriesGrowth({
        goals: [goalToWire(buildGoal({ targetKind: "done", metric: "books" }))],
      }),
    ).toThrow(SyncValidationError);
  });
});
