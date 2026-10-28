import { describe, expect, it, beforeEach } from "vitest";

import { createMusicCompositionUseCases } from "@/application/music-practice/composition";
import { createDjSetUseCases } from "@/application/music-practice/dj-set";
import { createPracticeInstrumentUseCases } from "@/application/music-practice/instrument";
import { createPracticeExerciseUseCases } from "@/application/music-practice/exercise";
import { createPracticePlanUseCases } from "@/application/music-practice/plan";
import { createPracticeLogUseCases } from "@/application/music-practice/practice-log";
import { createLearningPieceUseCases } from "@/application/music-practice/learning-piece";
import type { MusicPracticeCompositionRepository } from "@/application/ports/music-practice-composition-repository";
import type { MusicPracticeDjSetRepository } from "@/application/ports/music-practice-dj-set-repository";
import type { MusicPracticeInstrumentRepository } from "@/application/ports/music-practice-instrument-repository";
import type { MusicPracticeExerciseRepository } from "@/application/ports/music-practice-exercise-repository";
import type { MusicPracticePlanRepository } from "@/application/ports/music-practice-plan-repository";
import type { MusicPracticeLogRepository } from "@/application/ports/music-practice-log-repository";
import type { MusicPracticeLearningPieceRepository } from "@/application/ports/music-practice-learning-piece-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { MusicComposition } from "@/domain/music-composition";
import type { DjSet } from "@/domain/dj-set";
import type { PracticeInstrument } from "@/domain/practice-instrument";
import type { PracticeExercise } from "@/domain/practice-exercise";
import type { PracticePlan } from "@/domain/practice-plan";
import type { PracticeLog } from "@/domain/practice-log";
import type { LearningPiece } from "@/domain/learning-piece";
import { buildPlanAssignment } from "./fixtures";

function memoryRepo<T extends { id: string; deletedAt?: string | null; isActive?: boolean }>() {
  const store = new Map<string, T>();
  return {
    get: (id: string) => Promise.resolve(store.get(id)),
    list: () => Promise.resolve([...store.values()].filter((r) => r.deletedAt === null)),
    upsert: (row: T) => {
      store.set(row.id, row);
      return Promise.resolve(row);
    },
    subscribe: () => () => {},
    outbox: () => Promise.resolve([...store.keys()]),
    clearOutbox: () => Promise.resolve(),
    _store: store,
  };
}

const meta: MetaStore = {
  get: async () => undefined,
  set: async () => {},
};

let idCounter = 0;
const idGenerator = { newId: () => `00000000-0000-4000-8000-${String(++idCounter).padStart(12, "0")}` };
const now = () => new Date("2026-06-15T10:00:00.000Z").getTime();

describe("music practice use cases", () => {
  let compositions: ReturnType<typeof memoryRepo<MusicComposition>>;
  let djSets: ReturnType<typeof memoryRepo<DjSet>>;
  let instruments: ReturnType<typeof memoryRepo<PracticeInstrument>>;
  let exercises: ReturnType<typeof memoryRepo<PracticeExercise>>;
  let plans: ReturnType<typeof memoryRepo<PracticePlan>> & {
    getActive(): Promise<PracticePlan | undefined>;
  };
  let logs: ReturnType<typeof memoryRepo<PracticeLog>>;
  let pieces: ReturnType<typeof memoryRepo<LearningPiece>>;

  beforeEach(() => {
    idCounter = 0;
    compositions = memoryRepo<MusicComposition>();
    djSets = memoryRepo<DjSet>();
    instruments = memoryRepo<PracticeInstrument>();
    exercises = memoryRepo<PracticeExercise>();
    const planMem = memoryRepo<PracticePlan>();
    plans = {
      ...planMem,
      getActive: async () => {
        const rows = [...planMem._store.values()];
        return rows.find((p) => p.isActive && p.deletedAt === null);
      },
    };
    logs = memoryRepo<PracticeLog>();
    pieces = memoryRepo<LearningPiece>();
  });

  it("creates and finishes a composition with session note", async () => {
    const uc = createMusicCompositionUseCases({
      compositions: compositions as MusicPracticeCompositionRepository,
      meta,
      idGenerator,
      now,
    });
    const created = await uc.createComposition({ title: "  New idea  " });
    expect(created.status).toBe("idea");
    await uc.appendSessionNote(created.id, { text: "Worked on chorus" });
    const finished = await uc.updateComposition(created.id, {
      status: "finished",
      finishedAt: "2026-06-10",
    });
    expect(finished.finishedAt).toBe("2026-06-10");
  });

  it("marks DJ set performed and cancels", async () => {
    const uc = createDjSetUseCases({
      djSets: djSets as MusicPracticeDjSetRepository,
      meta,
      idGenerator,
      now,
    });
    const created = await uc.createDjSet({ title: "Warehouse" });
    const performed = await uc.markPerformed(created.id, "2026-06-01");
    expect(performed.status).toBe("performed");
    const cancelled = await uc.cancelDjSet(performed.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("manages apprentissage plan and mark done today", async () => {
    const instrumentUc = createPracticeInstrumentUseCases({
      instruments: instruments as MusicPracticeInstrumentRepository,
      meta,
      idGenerator,
      now,
    });
    const exerciseUc = createPracticeExerciseUseCases({
      exercises: exercises as MusicPracticeExerciseRepository,
      meta,
      idGenerator,
      now,
    });
    const planUc = createPracticePlanUseCases({
      plans: plans as MusicPracticePlanRepository,
      meta,
      idGenerator,
      now,
    });
    const logUc = createPracticeLogUseCases({
      logs: logs as MusicPracticeLogRepository,
      learningPieces: pieces as MusicPracticeLearningPieceRepository,
      meta,
      idGenerator,
      now,
    });
    const pieceUc = createLearningPieceUseCases({
      learningPieces: pieces as MusicPracticeLearningPieceRepository,
      meta,
      idGenerator,
      now,
    });

    const instrument = await instrumentUc.createQuick({ name: "Guitare" });
    const exercise = await exerciseUc.createQuick({ title: "Arpèges", instrumentId: instrument.id });
    const plan = await planUc.createPlan({ name: "Semaine" });
    await planUc.upsertPlan({
      ...plan,
      assignments: [buildPlanAssignment({ exerciseId: exercise.id })],
    });
    const piece = await pieceUc.createPiece({ title: "Blackbird" });
    const log = await logUc.markDoneToday({ exerciseIds: [exercise.id], learningPieceId: piece.id });
    expect(log.practicedAt).toBe("2026-06-15");
    const updatedPiece = await pieceUc.getLearningPiece(piece.id);
    expect(updatedPiece?.lastPracticedAt).toBe("2026-06-15");
    await logUc.upsertLog({ ...log, notes: "Focused" });
    await logUc.deleteLog(log.id);
    await logUc.restoreLog(log.id);
  });

  it("updates composition metadata and upserts", async () => {
    const uc = createMusicCompositionUseCases({
      compositions: compositions as MusicPracticeCompositionRepository,
      meta,
      idGenerator,
      now,
    });
    const row = await uc.createComposition({ title: "Track", status: "in_progress" });
    const updated = await uc.updateComposition(row.id, {
      genreStyle: "Ambient",
      tempoBpm: 120,
      linkedTrackIds: [],
    });
    expect(updated.genreStyle).toBe("Ambient");
    expect((await uc.listCompositions()).length).toBeGreaterThan(0);
    await uc.upsertComposition(updated);
  });

  it("covers DJ set lifecycle helpers", async () => {
    const uc = createDjSetUseCases({
      djSets: djSets as MusicPracticeDjSetRepository,
      meta,
      idGenerator,
      now,
    });
    const planned = await uc.createDjSet({ title: "Set" });
    const performed = await uc.transitionPlannedToPerformed(planned.id, "2026-06-01");
    expect(performed.setlist).toEqual(planned.setlist);
    await uc.updateDjSet(performed.id, { notes: "Great crowd" });
    await uc.deleteDjSet(performed.id);
    await uc.restoreDjSet(performed.id);
  });

  it("covers instrument exercise plan restore paths", async () => {
    const instrumentUc = createPracticeInstrumentUseCases({
      instruments: instruments as MusicPracticeInstrumentRepository,
      meta,
      idGenerator,
      now,
    });
    const exerciseUc = createPracticeExerciseUseCases({
      exercises: exercises as MusicPracticeExerciseRepository,
      meta,
      idGenerator,
      now,
    });
    const planUc = createPracticePlanUseCases({
      plans: plans as MusicPracticePlanRepository,
      meta,
      idGenerator,
      now,
    });
    const pieceUc = createLearningPieceUseCases({
      learningPieces: pieces as MusicPracticeLearningPieceRepository,
      meta,
      idGenerator,
      now,
    });
    const i = await instrumentUc.createQuick({ name: "Violon" });
    await instrumentUc.deleteInstrument(i.id);
    await instrumentUc.restoreInstrument(i.id);
    const e = await exerciseUc.createQuick({ title: "Vibrato" });
    await exerciseUc.deleteExercise(e.id);
    await exerciseUc.restoreExercise(e.id);
    const plan = await planUc.createPlan({ name: "Plan" });
    await planUc.deletePlan(plan.id);
    await planUc.restorePlan(plan.id);
    const piece = await pieceUc.createPiece({ title: "Piece" });
    await pieceUc.updatePiece(piece.id, { status: "comfortable" });
    await pieceUc.deleteLearningPiece(piece.id);
    await pieceUc.restoreLearningPiece(piece.id);
  });

  it("lists and upserts instruments", async () => {
    const instrumentUc = createPracticeInstrumentUseCases({
      instruments: instruments as MusicPracticeInstrumentRepository,
      meta,
      idGenerator,
      now,
    });
    const row = await instrumentUc.createQuick({ name: "Harpe" });
    expect((await instrumentUc.listInstruments()).length).toBe(1);
    expect((await instrumentUc.getInstrument(row.id))?.name).toBe("Harpe");
    await instrumentUc.upsertInstrument({ ...row, notes: "Pedal harp" });
  });

  it("covers exercise and plan getters", async () => {
    const exerciseUc = createPracticeExerciseUseCases({
      exercises: exercises as MusicPracticeExerciseRepository,
      meta,
      idGenerator,
      now,
    });
    const planUc = createPracticePlanUseCases({
      plans: plans as MusicPracticePlanRepository,
      meta,
      idGenerator,
      now,
    });
    const instrumentUc = createPracticeInstrumentUseCases({
      instruments: instruments as MusicPracticeInstrumentRepository,
      meta,
      idGenerator,
      now,
    });
    const instrument = await instrumentUc.createQuick({ name: "Flute" });
    const exercise = await exerciseUc.createQuick({ title: "Scale", instrumentId: instrument.id });
    expect(await exerciseUc.getExercise(exercise.id)).toBeDefined();
    expect((await exerciseUc.listExercises()).length).toBe(1);
    const plan = await planUc.createPlan({ name: "Daily" });
    expect(await planUc.getActivePlan()).toBeDefined();
    expect((await planUc.listPlans()).length).toBe(1);
  });

  it("soft deletes and restores composition", async () => {
    const uc = createMusicCompositionUseCases({
      compositions: compositions as MusicPracticeCompositionRepository,
      meta,
      idGenerator,
      now,
    });
    const row = await uc.createComposition({ title: "Draft" });
    await uc.deleteComposition(row.id);
    expect((await uc.getComposition(row.id))?.deletedAt).not.toBeNull();
    await uc.restoreComposition(row.id);
    expect((await uc.getComposition(row.id))?.deletedAt).toBeNull();
  });

  it("clears finishedAt when leaving finished status", async () => {
    const uc = createMusicCompositionUseCases({
      compositions: compositions as MusicPracticeCompositionRepository,
      meta,
      idGenerator,
      now,
    });
    const row = await uc.createComposition({ title: "Loop", status: "finished" });
    expect(row.finishedAt).toBe("2026-06-15");
    const back = await uc.updateComposition(row.id, { status: "in_progress" });
    expect(back.finishedAt).toBeNull();
  });

  it("updates DJ set planned status and performedAt branches", async () => {
    const uc = createDjSetUseCases({
      djSets: djSets as MusicPracticeDjSetRepository,
      meta,
      idGenerator,
      now,
    });
    const planned = await uc.createDjSet({ title: "Club" });
    const performed = await uc.updateDjSet(planned.id, { status: "performed" });
    expect(performed.performedAt).toBe("2026-06-15");
    const replanned = await uc.updateDjSet(performed.id, { status: "planned" });
    expect(replanned.performedAt).toBeNull();
  });
});
