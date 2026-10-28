import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

import { calendarDate } from "./music-composition";
import { validateDateNotFuture } from "./music-practice-dates";

const timestamp = z.iso.datetime({ offset: true });

export const practiceKindSchema = z.enum(["structured", "improvisation"]);
export type PracticeKind = z.infer<typeof practiceKindSchema>;

export type PracticeLog = {
  id: string;
  /** Eligible for periodic recap (011 FR-006); one Musique achievement per log id. */
  practicedAt: string;
  practiceKind: PracticeKind;
  instrumentId: string | null;
  exerciseIds: string[];
  learningPieceId: string | null;
  durationMinutes: number | null;
  notes: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const logShape = {
  id: z.uuid(),
  practicedAt: calendarDate,
  practiceKind: practiceKindSchema.default("structured"),
  instrumentId: z.uuid().nullable(),
  exerciseIds: z.array(z.uuid()),
  learningPieceId: z.uuid().nullable(),
  durationMinutes: z.number().int().min(0).nullable(),
  notes: z.string().max(2000).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const practiceLogSchema = z.strictObject(logShape);

const SNAKE: Partial<Record<keyof PracticeLog, string>> = {
  practicedAt: "practiced_at",
  practiceKind: "practice_kind",
  instrumentId: "instrument_id",
  exerciseIds: "exercise_ids",
  learningPieceId: "learning_piece_id",
  durationMinutes: "duration_minutes",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof PracticeLog] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const practiceLogWireSchema = z.strictObject({
  id: logShape.id,
  practiced_at: logShape.practicedAt,
  practice_kind: logShape.practiceKind,
  instrument_id: logShape.instrumentId,
  exercise_ids: logShape.exerciseIds,
  learning_piece_id: logShape.learningPieceId,
  duration_minutes: logShape.durationMinutes,
  notes: logShape.notes,
  deleted_at: logShape.deletedAt,
  fields_updated_at: logShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PracticeLogWire = z.infer<typeof practiceLogWireSchema>;

export function practiceLogToWire(log: PracticeLog, serverUpdatedAt: string | null = null): PracticeLogWire {
  const { fieldsUpdatedAt, ...rest } = log;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PracticeLogWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPracticeLog(wire: PracticeLogWire): PracticeLog {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return practiceLogSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as PracticeLog;
}

const MERGED_FIELDS = [
  "practiced_at",
  "practice_kind",
  "instrument_id",
  "exercise_ids",
  "learning_piece_id",
  "duration_minutes",
  "notes",
  "deleted_at",
] as const satisfies readonly (keyof PracticeLogWire)[];

export function mergePracticeLog(local: PracticeLogWire, remote: PracticeLogWire): PracticeLogWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

export function validatePracticeLog(log: PracticeLog, today?: string): string | null {
  if (today !== undefined) {
    const future = validateDateNotFuture(log.practicedAt, today);
    if (future !== null) return future;
  }
  return null;
}
