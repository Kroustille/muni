import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export type PracticeExercise = {
  id: string;
  title: string;
  instrumentId: string | null;
  category: string | null;
  notes: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const exerciseShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  instrumentId: z.uuid().nullable(),
  category: z.string().trim().max(100).nullable(),
  notes: z.string().max(2000).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const practiceExerciseSchema = z.strictObject(exerciseShape);

const SNAKE: Partial<Record<keyof PracticeExercise, string>> = {
  instrumentId: "instrument_id",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof PracticeExercise] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const practiceExerciseWireSchema = z.strictObject({
  id: exerciseShape.id,
  title: exerciseShape.title,
  instrument_id: exerciseShape.instrumentId,
  category: exerciseShape.category,
  notes: exerciseShape.notes,
  deleted_at: exerciseShape.deletedAt,
  fields_updated_at: exerciseShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PracticeExerciseWire = z.infer<typeof practiceExerciseWireSchema>;

export function practiceExerciseToWire(
  exercise: PracticeExercise,
  serverUpdatedAt: string | null = null,
): PracticeExerciseWire {
  const { fieldsUpdatedAt, ...rest } = exercise;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PracticeExerciseWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPracticeExercise(wire: PracticeExerciseWire): PracticeExercise {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return practiceExerciseSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as PracticeExercise;
}

const MERGED_FIELDS = [
  "title",
  "instrument_id",
  "category",
  "notes",
  "deleted_at",
] as const satisfies readonly (keyof PracticeExerciseWire)[];

export function mergePracticeExercise(
  local: PracticeExerciseWire,
  remote: PracticeExerciseWire,
): PracticeExerciseWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

export function validatePracticeExercise(exercise: PracticeExercise): string | null {
  if (exercise.title.trim().length === 0) return "title required";
  return null;
}
