import { z } from "zod";

import { mergeLwwWire } from "./merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export const plannedExerciseSchema = z.strictObject({
  exerciseId: z.string().min(1),
  defaultSetCount: z.number().int().min(0).optional(),
  targetReps: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export type PlannedExercise = z.infer<typeof plannedExerciseSchema>;

export const plannedSessionSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  sortOrder: z.number(),
  exercises: z.array(plannedExerciseSchema),
});

export type PlannedSession = z.infer<typeof plannedSessionSchema>;

export type FitnessProgram = {
  id: string;
  name: string;
  isActive: boolean;
  plannedSessions: PlannedSession[];
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const programShape = {
  id: z.uuid(),
  name: z.string().trim().min(1).max(200),
  isActive: z.boolean(),
  plannedSessions: z.array(plannedSessionSchema),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const fitnessProgramSchema = z.strictObject(programShape);

const SNAKE: Partial<Record<keyof FitnessProgram, string>> = {
  isActive: "is_active",
  plannedSessions: "planned_sessions",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof FitnessProgram] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const fitnessProgramWireSchema = z.strictObject({
  id: programShape.id,
  name: programShape.name,
  is_active: programShape.isActive,
  planned_sessions: programShape.plannedSessions,
  deleted_at: programShape.deletedAt,
  fields_updated_at: programShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type FitnessProgramWire = z.infer<typeof fitnessProgramWireSchema>;

export function fitnessProgramToWire(
  program: FitnessProgram,
  serverUpdatedAt: string | null = null,
): FitnessProgramWire {
  const { fieldsUpdatedAt, ...rest } = program;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<FitnessProgramWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToFitnessProgram(wire: FitnessProgramWire): FitnessProgram {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return fitnessProgramSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as FitnessProgram;
}

const MERGED_PROGRAM_FIELDS = [
  "name",
  "is_active",
  "planned_sessions",
  "deleted_at",
] as const satisfies readonly (keyof FitnessProgramWire)[];

export function mergeFitnessProgram(
  local: FitnessProgramWire,
  remote: FitnessProgramWire,
): FitnessProgramWire {
  return mergeLwwWire(local, remote, MERGED_PROGRAM_FIELDS);
}

export function validatePlannedSession(session: PlannedSession): string | null {
  if (session.title.trim().length === 0) return "title required";
  if (session.weekdays.length === 0) return "weekdays required";
  return null;
}
