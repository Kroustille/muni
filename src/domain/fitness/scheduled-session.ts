import { z } from "zod";

import { mergeLwwWire } from "./merge-lww";
import { templateExerciseSchema, type TemplateExercise } from "./session-template";

const timestamp = z.iso.datetime({ offset: true });
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type FitnessScheduledSession = {
  id: string;
  calendarDate: string;
  sessionTemplateId: string;
  sortOrder: number;
  titleSnapshot: string | null;
  templateExercisesSnapshot: TemplateExercise[] | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const scheduledShape = {
  id: z.uuid(),
  calendarDate: calendarDate,
  sessionTemplateId: z.string().uuid(),
  sortOrder: z.number(),
  titleSnapshot: z.string().trim().min(1).max(200).nullable().default(null),
  templateExercisesSnapshot: z.array(templateExerciseSchema).nullable().default(null),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const fitnessScheduledSessionSchema = z.strictObject(scheduledShape);

const SNAKE: Partial<Record<keyof FitnessScheduledSession, string>> = {
  calendarDate: "calendar_date",
  sessionTemplateId: "session_template_id",
  sortOrder: "sort_order",
  titleSnapshot: "title_snapshot",
  templateExercisesSnapshot: "template_exercises_snapshot",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof FitnessScheduledSession] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const fitnessScheduledSessionWireSchema = z.strictObject({
  id: scheduledShape.id,
  calendar_date: scheduledShape.calendarDate,
  session_template_id: scheduledShape.sessionTemplateId,
  sort_order: scheduledShape.sortOrder,
  title_snapshot: scheduledShape.titleSnapshot,
  template_exercises_snapshot: scheduledShape.templateExercisesSnapshot,
  deleted_at: scheduledShape.deletedAt,
  fields_updated_at: scheduledShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type FitnessScheduledSessionWire = z.infer<typeof fitnessScheduledSessionWireSchema>;

export function fitnessScheduledSessionToWire(
  row: FitnessScheduledSession,
  serverUpdatedAt: string | null = null,
): FitnessScheduledSessionWire {
  const { fieldsUpdatedAt, ...rest } = row;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<
      FitnessScheduledSessionWire,
      "fields_updated_at" | "server_updated_at"
    >),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToFitnessScheduledSession(
  wire: FitnessScheduledSessionWire,
): FitnessScheduledSession {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return fitnessScheduledSessionSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as FitnessScheduledSession;
}

const MERGED_SCHEDULED_FIELDS = [
  "calendar_date",
  "session_template_id",
  "sort_order",
  "title_snapshot",
  "template_exercises_snapshot",
  "deleted_at",
] as const satisfies readonly (keyof FitnessScheduledSessionWire)[];

export function mergeFitnessScheduledSession(
  local: FitnessScheduledSessionWire,
  remote: FitnessScheduledSessionWire,
): FitnessScheduledSessionWire {
  return mergeLwwWire(local, remote, MERGED_SCHEDULED_FIELDS);
}
