import { describe, expect, it } from "vitest";

import {
  mergeMusicComposition,
  musicCompositionToWire,
  wireToMusicComposition,
} from "@/domain/music-composition";
import { djSetToWire, mergeDjSet, wireToDjSet } from "@/domain/dj-set";
import {
  mergePracticeInstrument,
  practiceInstrumentToWire,
  wireToPracticeInstrument,
} from "@/domain/practice-instrument";
import {
  mergePracticeExercise,
  practiceExerciseToWire,
  wireToPracticeExercise,
} from "@/domain/practice-exercise";
import { mergePracticePlan, practicePlanToWire, wireToPracticePlan } from "@/domain/practice-plan";
import { mergePracticeLog, practiceLogToWire, wireToPracticeLog } from "@/domain/practice-log";
import {
  learningPieceToWire,
  mergeLearningPiece,
  wireToLearningPiece,
} from "@/domain/learning-piece";
import {
  buildDjSet,
  buildLearningPiece,
  buildMusicComposition,
  buildPracticeExercise,
  buildPracticeInstrument,
  buildPracticeLog,
  buildPracticePlan,
} from "./fixtures";

describe("music practice wire roundtrips", () => {
  it("roundtrips composition", () => {
    const row = buildMusicComposition({ sessionNotes: [{ date: "2026-01-01", text: "Note" }] });
    const wire = musicCompositionToWire(row);
    expect(wireToMusicComposition(wire).title).toBe(row.title);
  });

  it("roundtrips dj set", () => {
    const row = buildDjSet({ setlist: [{ sortOrder: 0, text: "Track" }] });
    const wire = djSetToWire(row);
    expect(wireToDjSet(wire).setlist[0]?.text).toBe("Track");
  });

  it("roundtrips apprentissage entities", () => {
    expect(wireToPracticeInstrument(practiceInstrumentToWire(buildPracticeInstrument())).name).toBe(
      "Piano",
    );
    expect(wireToPracticeExercise(practiceExerciseToWire(buildPracticeExercise())).title).toContain(
      "Gamme",
    );
    expect(wireToPracticePlan(practicePlanToWire(buildPracticePlan())).assignments).toHaveLength(1);
    expect(wireToPracticeLog(practiceLogToWire(buildPracticeLog())).practiceKind).toBe("structured");
    expect(wireToLearningPiece(learningPieceToWire(buildLearningPiece())).title).toBe("Für Elise");
  });
});

describe("music practice LWW merge", () => {
  it("merges composition fields independently", () => {
    const base = musicCompositionToWire(buildMusicComposition());
    const titleWin = {
      ...base,
      title: "New title",
      fields_updated_at: { ...base.fields_updated_at, title: "2026-02-01T00:00:00.000Z-1-a" },
    };
    const statusWin = {
      ...base,
      status: "in_progress" as const,
      fields_updated_at: { ...base.fields_updated_at, status: "2026-02-02T00:00:00.000Z-1-b" },
    };
    const merged = mergeMusicComposition(titleWin, statusWin);
    expect(merged.title).toBe("New title");
    expect(merged.status).toBe("in_progress");
  });

  it("merges dj set title and setlist", () => {
    const base = djSetToWire(buildDjSet());
    const a = {
      ...base,
      title: "A",
      fields_updated_at: { ...base.fields_updated_at, title: "2026-02-01T00:00:00.000Z-1-a" },
    };
    const b = {
      ...base,
      setlist: [{ sortOrder: 0, text: "B" }],
      fields_updated_at: { ...base.fields_updated_at, setlist: "2026-02-02T00:00:00.000Z-1-b" },
    };
    const merged = mergeDjSet(a, b);
    expect(merged.title).toBe("A");
    expect(merged.setlist[0]?.text).toBe("B");
  });

  it("merges instrument exercise plan log piece", () => {
    const i = practiceInstrumentToWire(buildPracticeInstrument());
    expect(
      mergePracticeInstrument(
        { ...i, name: "B", fields_updated_at: { ...i.fields_updated_at, name: "2026-02-02T00:00:00.000Z-1-b" } },
        i,
      ).name,
    ).toBe("B");
    const e = practiceExerciseToWire(buildPracticeExercise());
    expect(
      mergePracticeExercise(
        { ...e, title: "X", fields_updated_at: { ...e.fields_updated_at, title: "2026-02-02T00:00:00.000Z-1-b" } },
        e,
      ).title,
    ).toBe("X");
    const p = practicePlanToWire(buildPracticePlan());
    expect(
      mergePracticePlan(
        { ...p, name: "Plan B", fields_updated_at: { ...p.fields_updated_at, name: "2026-02-02T00:00:00.000Z-1-b" } },
        p,
      ).name,
    ).toBe("Plan B");
    const l = practiceLogToWire(buildPracticeLog());
    expect(
      mergePracticeLog(
        { ...l, notes: "ok", fields_updated_at: { ...l.fields_updated_at, notes: "2026-02-02T00:00:00.000Z-1-b" } },
        l,
      ).notes,
    ).toBe("ok");
    const piece = learningPieceToWire(buildLearningPiece());
    expect(
      mergeLearningPiece(
        {
          ...piece,
          title: "Piece",
          fields_updated_at: { ...piece.fields_updated_at, title: "2026-02-02T00:00:00.000Z-1-b" },
        },
        piece,
      ).title,
    ).toBe("Piece");
  });
});
