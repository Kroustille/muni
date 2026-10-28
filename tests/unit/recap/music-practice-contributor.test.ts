import { describe, expect, it } from "vitest";

import { musicPracticeRecapContributor } from "@/application/recap/contributors/music-practice-contributor";
import type { MusicPracticeRecapRepository } from "@/application/ports/music-practice-recap-repository";
import { createRecapTestDeps } from "./recap-fixtures";

const musicPractice: MusicPracticeRecapRepository = {
  async listCompositions() {
    return [
      {
        id: "c1",
        title: "My track",
        status: "finished",
        finishedAt: "2026-06-10",
        deletedAt: null,
      },
    ];
  },
  async listDjSets() {
    return [
      {
        id: "d1",
        title: "Club set",
        status: "performed",
        performedAt: "2026-06-11",
        deletedAt: null,
      },
    ];
  },
  async listPracticeLogs() {
    return [
      {
        id: "p1",
        practicedAt: "2026-06-12",
        practiceKind: "structured",
        deletedAt: null,
        learningPieceTitle: "Scale study",
      },
      {
        id: "p2",
        practicedAt: "2026-06-12",
        practiceKind: "improvisation",
        deletedAt: null,
        instrumentName: "Piano",
      },
      {
        id: "p3",
        practicedAt: "2026-06-13",
        practiceKind: "structured",
        deletedAt: null,
        learningPieceTitle: "Scale study",
      },
    ];
  },
};

describe("musicPracticeRecapContributor", () => {
  it("maps finishedAt, performedAt, and one line per practice_log", async () => {
    const deps = createRecapTestDeps({ musicPractice });
    const rows = await musicPracticeRecapContributor.collectAchievements(deps, {
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(5);
    expect(rows.filter((row) => row.sourcePracticeLogId === "p1")).toHaveLength(1);
    expect(rows.filter((row) => row.sourcePracticeLogId === "p3")).toHaveLength(1);
    expect(rows.find((row) => row.musicLineKind === "improvisation")).toBeDefined();
  });

  it("skips soft-deleted practice logs", async () => {
    const deps = createRecapTestDeps({
      musicPractice: {
        ...musicPractice,
        async listPracticeLogs() {
          return [
            {
              id: "p-deleted",
              practicedAt: "2026-06-12",
              practiceKind: "structured",
              deletedAt: "2026-06-13T00:00:00.000Z",
            },
          ];
        },
      },
    });
    const rows = await musicPracticeRecapContributor.collectAchievements(deps, {
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      timeZone: "Europe/Paris",
    });
    expect(rows.some((row) => row.sourcePracticeLogId === "p-deleted")).toBe(false);
  });

  it("dedupes same practice log id only", async () => {
    const deps = createRecapTestDeps({
      musicPractice: {
        ...musicPractice,
        async listPracticeLogs() {
          const row = {
            id: "same",
            practicedAt: "2026-06-12",
            practiceKind: "structured" as const,
            deletedAt: null,
          };
          return [row, row];
        },
      },
    });
    const rows = await musicPracticeRecapContributor.collectAchievements(deps, {
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      timeZone: "Europe/Paris",
    });
    expect(rows.filter((row) => row.sourcePracticeLogId === "same")).toHaveLength(1);
  });
});
