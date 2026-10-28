import {
  musicCompositionToWire,
  musicCompositionWireSchema,
  mergeMusicComposition,
  validateMusicComposition,
  wireToMusicComposition,
  type MusicCompositionWire,
} from "@/domain/music-composition";
import {
  djSetToWire,
  djSetWireSchema,
  mergeDjSet,
  validateDjSet,
  wireToDjSet,
  type DjSetWire,
} from "@/domain/dj-set";
import {
  practiceInstrumentToWire,
  practiceInstrumentWireSchema,
  mergePracticeInstrument,
  wireToPracticeInstrument,
  type PracticeInstrumentWire,
} from "@/domain/practice-instrument";
import {
  practiceExerciseToWire,
  practiceExerciseWireSchema,
  mergePracticeExercise,
  wireToPracticeExercise,
  type PracticeExerciseWire,
} from "@/domain/practice-exercise";
import {
  practicePlanToWire,
  practicePlanWireSchema,
  mergePracticePlan,
  wireToPracticePlan,
  type PracticePlanWire,
} from "@/domain/practice-plan";
import {
  practiceLogToWire,
  practiceLogWireSchema,
  mergePracticeLog,
  wireToPracticeLog,
  type PracticeLogWire,
} from "@/domain/practice-log";
import {
  learningPieceToWire,
  learningPieceWireSchema,
  mergeLearningPiece,
  wireToLearningPiece,
  type LearningPieceWire,
} from "@/domain/learning-piece";
import { localCalendarDate } from "@/domain/music-practice-dates";
import type { ServerMusicPracticeCompositionRepository } from "@/application/ports/music-practice-composition-repository";
import type { ServerMusicPracticeDjSetRepository } from "@/application/ports/music-practice-dj-set-repository";
import type { ServerMusicPracticeInstrumentRepository } from "@/application/ports/music-practice-instrument-repository";
import type { ServerMusicPracticeExerciseRepository } from "@/application/ports/music-practice-exercise-repository";
import type { ServerMusicPracticePlanRepository } from "@/application/ports/music-practice-plan-repository";
import type { ServerMusicPracticeLogRepository } from "@/application/ports/music-practice-log-repository";
import type { ServerMusicPracticeLearningPieceRepository } from "@/application/ports/music-practice-learning-piece-repository";
import type { MusicPracticeSyncPayload } from "@/application/music-practice-sync";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type MusicPracticeSyncService = {
  push(userId: string, body: MusicPracticeSyncPayload): Promise<MusicPracticeSyncPayload>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<MusicPracticeSyncPayload & { cursor: string }>;
};

type MusicPracticeSyncServiceDeps = {
  compositions: ServerMusicPracticeCompositionRepository;
  djSets: ServerMusicPracticeDjSetRepository;
  instruments: ServerMusicPracticeInstrumentRepository;
  exercises: ServerMusicPracticeExerciseRepository;
  plans: ServerMusicPracticePlanRepository;
  logs: ServerMusicPracticeLogRepository;
  learningPieces: ServerMusicPracticeLearningPieceRepository;
  now?: () => Date;
};

function assertUserId(userId: string): void {
  if (!userId) throw new SyncAuthError();
}

function formatZodIssues(error: { issues: { message: string }[] }): string {
  const messages = error.issues.map((issue) => issue.message).filter(Boolean);
  return messages.length > 0 ? messages.join("; ") : "validation failed";
}

function validateWireArray<T>(
  items: unknown[],
  label: string,
  schema: {
    safeParse: (
      v: unknown,
    ) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } };
  },
): T[] {
  const rowErrors: RowError[] = [];
  const validated: T[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item === null || typeof item !== "object") {
      rowErrors.push({ index, message: `invalid ${label}` });
      continue;
    }
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : undefined;
    if (Object.prototype.hasOwnProperty.call(record, "user_id")) {
      rowErrors.push({ index, id, message: "user_id must not be present" });
      continue;
    }
    const parsed = schema.safeParse(item);
    if (!parsed.success) {
      rowErrors.push({ index, id, message: formatZodIssues(parsed.error) });
      continue;
    }
    validated.push(parsed.data);
  }
  if (rowErrors.length > 0) throw new SyncValidationError(rowErrors);
  return validated;
}

export function validatePushMusicPractice(body: {
  compositions?: unknown[];
  djSets?: unknown[];
  instruments?: unknown[];
  exercises?: unknown[];
  plans?: unknown[];
  logs?: unknown[];
  learningPieces?: unknown[];
}): MusicPracticeSyncPayload {
  const payload: MusicPracticeSyncPayload = {
    compositions: validateWireArray(body.compositions ?? [], "composition", musicCompositionWireSchema),
    djSets: validateWireArray(body.djSets ?? [], "djSet", djSetWireSchema),
    instruments: validateWireArray(body.instruments ?? [], "instrument", practiceInstrumentWireSchema),
    exercises: validateWireArray(body.exercises ?? [], "exercise", practiceExerciseWireSchema),
    plans: validateWireArray(body.plans ?? [], "plan", practicePlanWireSchema),
    logs: validateWireArray(body.logs ?? [], "log", practiceLogWireSchema),
    learningPieces: validateWireArray(
      body.learningPieces ?? [],
      "learningPiece",
      learningPieceWireSchema,
    ),
  };
  const today = localCalendarDate();
  const domainErrors: RowError[] = [];
  payload.compositions.forEach((wire, index) => {
    const err = validateMusicComposition(wireToMusicComposition(wire), today);
    if (err !== null) domainErrors.push({ index, id: wire.id, message: err });
  });
  payload.djSets.forEach((wire, index) => {
    const err = validateDjSet(wireToDjSet(wire), today);
    if (err !== null) domainErrors.push({ index, id: wire.id, message: err });
  });
  if (domainErrors.length > 0) throw new SyncValidationError(domainErrors);
  return payload;
}

function serverUpdatedAtIso(now: () => Date): string {
  return now().toISOString();
}

async function pushCompositions(
  userId: string,
  repo: ServerMusicPracticeCompositionRepository,
  incoming: MusicCompositionWire[],
  now: () => Date,
): Promise<MusicCompositionWire[]> {
  return repo.transaction(async (compositions) => {
    const results: MusicCompositionWire[] = [];
    for (const row of incoming) {
      const locked = await compositions.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: MusicCompositionWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = musicCompositionToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : { ...mergeMusicComposition(row, existingWire), server_updated_at: serverUpdatedAtIso(now) };
      }
      const saved = await compositions.upsert(userId, wireToMusicComposition(merged));
      results.push(musicCompositionToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushDjSets(
  userId: string,
  repo: ServerMusicPracticeDjSetRepository,
  incoming: DjSetWire[],
  now: () => Date,
): Promise<DjSetWire[]> {
  return repo.transaction(async (djSets) => {
    const results: DjSetWire[] = [];
    for (const row of incoming) {
      const locked = await djSets.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: DjSetWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = djSetToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : { ...mergeDjSet(row, existingWire), server_updated_at: serverUpdatedAtIso(now) };
      }
      const saved = await djSets.upsert(userId, wireToDjSet(merged));
      results.push(djSetToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushInstruments(
  userId: string,
  repo: ServerMusicPracticeInstrumentRepository,
  incoming: PracticeInstrumentWire[],
  now: () => Date,
): Promise<PracticeInstrumentWire[]> {
  return repo.transaction(async (instruments) => {
    const results: PracticeInstrumentWire[] = [];
    for (const row of incoming) {
      const locked = await instruments.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PracticeInstrumentWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = practiceInstrumentToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergePracticeInstrument(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await instruments.upsert(userId, wireToPracticeInstrument(merged));
      results.push(practiceInstrumentToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushExercises(
  userId: string,
  repo: ServerMusicPracticeExerciseRepository,
  incoming: PracticeExerciseWire[],
  now: () => Date,
): Promise<PracticeExerciseWire[]> {
  return repo.transaction(async (exercises) => {
    const results: PracticeExerciseWire[] = [];
    for (const row of incoming) {
      const locked = await exercises.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PracticeExerciseWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = practiceExerciseToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergePracticeExercise(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await exercises.upsert(userId, wireToPracticeExercise(merged));
      results.push(practiceExerciseToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushPlans(
  userId: string,
  repo: ServerMusicPracticePlanRepository,
  incoming: PracticePlanWire[],
  now: () => Date,
): Promise<PracticePlanWire[]> {
  return repo.transaction(async (plans) => {
    const results: PracticePlanWire[] = [];
    for (const row of incoming) {
      if (row.is_active) {
        await plans.demoteOtherActivePlans(userId, row.id);
      }
      const locked = await plans.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PracticePlanWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = practicePlanToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : { ...mergePracticePlan(row, existingWire), server_updated_at: serverUpdatedAtIso(now) };
      }
      const saved = await plans.upsert(userId, wireToPracticePlan(merged));
      results.push(practicePlanToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushLogs(
  userId: string,
  repo: ServerMusicPracticeLogRepository,
  incoming: PracticeLogWire[],
  now: () => Date,
): Promise<PracticeLogWire[]> {
  return repo.transaction(async (logs) => {
    const results: PracticeLogWire[] = [];
    for (const row of incoming) {
      const locked = await logs.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PracticeLogWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = practiceLogToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : { ...mergePracticeLog(row, existingWire), server_updated_at: serverUpdatedAtIso(now) };
      }
      const saved = await logs.upsert(userId, wireToPracticeLog(merged));
      results.push(practiceLogToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushLearningPieces(
  userId: string,
  repo: ServerMusicPracticeLearningPieceRepository,
  incoming: LearningPieceWire[],
  now: () => Date,
): Promise<LearningPieceWire[]> {
  return repo.transaction(async (pieces) => {
    const results: LearningPieceWire[] = [];
    for (const row of incoming) {
      const locked = await pieces.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: LearningPieceWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = learningPieceToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeLearningPiece(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await pieces.upsert(userId, wireToLearningPiece(merged));
      results.push(learningPieceToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

export function createMusicPracticeSyncService(
  deps: MusicPracticeSyncServiceDeps,
): MusicPracticeSyncService {
  const now = deps.now ?? (() => new Date());

  return {
    async push(userId, body) {
      assertUserId(userId);
      const validated = validatePushMusicPractice(body);
      const [
        compositions,
        djSets,
        instruments,
        exercises,
        plans,
        logs,
        learningPieces,
      ] = await Promise.all([
        pushCompositions(userId, deps.compositions, validated.compositions, now),
        pushDjSets(userId, deps.djSets, validated.djSets, now),
        pushInstruments(userId, deps.instruments, validated.instruments, now),
        pushExercises(userId, deps.exercises, validated.exercises, now),
        pushPlans(userId, deps.plans, validated.plans, now),
        pushLogs(userId, deps.logs, validated.logs, now),
        pushLearningPieces(userId, deps.learningPieces, validated.learningPieces, now),
      ]);
      return {
        compositions,
        djSets,
        instruments,
        exercises,
        plans,
        logs,
        learningPieces,
      };
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const sinceDate = since === null ? null : new Date(since);
      const [
        compositions,
        djSets,
        instruments,
        exercises,
        plans,
        logs,
        learningPieces,
      ] = await Promise.all([
        deps.compositions.pullSince(userId, sinceDate, limit),
        deps.djSets.pullSince(userId, sinceDate, limit),
        deps.instruments.pullSince(userId, sinceDate, limit),
        deps.exercises.pullSince(userId, sinceDate, limit),
        deps.plans.pullSince(userId, sinceDate, limit),
        deps.logs.pullSince(userId, sinceDate, limit),
        deps.learningPieces.pullSince(userId, sinceDate, limit),
      ]);
      const compositionWires = compositions.map((c) => musicCompositionToWire(c));
      const djSetWires = djSets.map((s) => djSetToWire(s));
      const instrumentWires = instruments.map((i) => practiceInstrumentToWire(i));
      const exerciseWires = exercises.map((e) => practiceExerciseToWire(e));
      const planWires = plans.map((p) => practicePlanToWire(p));
      const logWires = logs.map((l) => practiceLogToWire(l));
      const learningPieceWires = learningPieces.map((p) => learningPieceToWire(p));
      const cursors = [
        ...compositionWires.map((w) => w.server_updated_at),
        ...djSetWires.map((w) => w.server_updated_at),
        ...instrumentWires.map((w) => w.server_updated_at),
        ...exerciseWires.map((w) => w.server_updated_at),
        ...planWires.map((w) => w.server_updated_at),
        ...logWires.map((w) => w.server_updated_at),
        ...learningPieceWires.map((w) => w.server_updated_at),
      ].filter((c): c is string => typeof c === "string");
      const cursor = cursors.sort().at(-1) ?? since ?? "";
      return {
        compositions: compositionWires,
        djSets: djSetWires,
        instruments: instrumentWires,
        exercises: exerciseWires,
        plans: planWires,
        logs: logWires,
        learningPieces: learningPieceWires,
        cursor,
      };
    },
  };
}
