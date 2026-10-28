import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

import { calendarDate } from "./music-composition";
import { validateDateNotFuture } from "./music-practice-dates";

const timestamp = z.iso.datetime({ offset: true });

export const learningPieceStatusSchema = z.enum(["learning", "comfortable", "paused", "archived"]);
export type LearningPieceStatus = z.infer<typeof learningPieceStatusSchema>;

export type LearningPiece = {
  id: string;
  title: string;
  instrumentId: string | null;
  status: LearningPieceStatus;
  linkedTrackId: string | null;
  startedAt: string | null;
  lastPracticedAt: string | null;
  notes: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const pieceShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  instrumentId: z.uuid().nullable(),
  status: learningPieceStatusSchema,
  linkedTrackId: z.uuid().nullable(),
  startedAt: calendarDate.nullable(),
  lastPracticedAt: calendarDate.nullable(),
  notes: z.string().max(5000).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const learningPieceSchema = z.strictObject(pieceShape);

const SNAKE: Partial<Record<keyof LearningPiece, string>> = {
  instrumentId: "instrument_id",
  linkedTrackId: "linked_track_id",
  startedAt: "started_at",
  lastPracticedAt: "last_practiced_at",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof LearningPiece] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const learningPieceWireSchema = z.strictObject({
  id: pieceShape.id,
  title: pieceShape.title,
  instrument_id: pieceShape.instrumentId,
  status: pieceShape.status,
  linked_track_id: pieceShape.linkedTrackId,
  started_at: pieceShape.startedAt,
  last_practiced_at: pieceShape.lastPracticedAt,
  notes: pieceShape.notes,
  deleted_at: pieceShape.deletedAt,
  fields_updated_at: pieceShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type LearningPieceWire = z.infer<typeof learningPieceWireSchema>;

export function learningPieceToWire(
  piece: LearningPiece,
  serverUpdatedAt: string | null = null,
): LearningPieceWire {
  const { fieldsUpdatedAt, ...rest } = piece;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<LearningPieceWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToLearningPiece(wire: LearningPieceWire): LearningPiece {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return learningPieceSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as LearningPiece;
}

const MERGED_FIELDS = [
  "title",
  "instrument_id",
  "status",
  "linked_track_id",
  "started_at",
  "last_practiced_at",
  "notes",
  "deleted_at",
] as const satisfies readonly (keyof LearningPieceWire)[];

export function mergeLearningPiece(local: LearningPieceWire, remote: LearningPieceWire): LearningPieceWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

export function validateLearningPiece(piece: LearningPiece, today?: string): string | null {
  if (piece.startedAt !== null && today !== undefined) {
    const future = validateDateNotFuture(piece.startedAt, today);
    if (future !== null) return future;
  }
  if (piece.lastPracticedAt !== null && today !== undefined) {
    const future = validateDateNotFuture(piece.lastPracticedAt, today);
    if (future !== null) return future;
  }
  return null;
}
