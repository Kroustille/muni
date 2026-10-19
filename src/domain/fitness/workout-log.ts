import { z } from "zod";

import { mergeLwwWire } from "./merge-lww";

const timestamp = z.iso.datetime({ offset: true });
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const workoutStatusSchema = z.enum(["in_progress", "completed", "abandoned"]);
export type WorkoutStatus = z.infer<typeof workoutStatusSchema>;

export const setRowSchema = z.strictObject({
  reps: z.number().int().min(0).optional(),
  chargeKg: z.number().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  distanceNote: z.string().max(500).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
});

export type SetRow = z.infer<typeof setRowSchema>;

export const loggedExerciseSchema = z.strictObject({
  exerciseId: z.string().min(1),
  nameFrSnapshot: z.string().min(1),
  sets: z.array(setRowSchema),
});

export type LoggedExercise = z.infer<typeof loggedExerciseSchema>;

export const recoveryCheckInSchema = z.strictObject({
  sleep: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  soreness: z.number().int().min(1).max(5).optional(),
  note: z.string().max(2000).optional(),
});

export type RecoveryCheckIn = z.infer<typeof recoveryCheckInSchema>;

export type FitnessWorkoutLog = {
  id: string;
  status: WorkoutStatus;
  calendarDate: string;
  plannedSessionId: string | null;
  title: string;
  startedAt: string;
  completedAt: string | null;
  catalogVersion: number;
  loggedExercises: LoggedExercise[];
  recovery: RecoveryCheckIn | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const workoutShape = {
  id: z.uuid(),
  status: workoutStatusSchema,
  calendarDate: calendarDate,
  plannedSessionId: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(200),
  startedAt: timestamp,
  completedAt: timestamp.nullable(),
  catalogVersion: z.number().int().positive(),
  loggedExercises: z.array(loggedExerciseSchema),
  recovery: recoveryCheckInSchema.nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const fitnessWorkoutLogSchema = z.strictObject(workoutShape);

const SNAKE: Partial<Record<keyof FitnessWorkoutLog, string>> = {
  calendarDate: "calendar_date",
  plannedSessionId: "planned_session_id",
  startedAt: "started_at",
  completedAt: "completed_at",
  catalogVersion: "catalog_version",
  loggedExercises: "logged_exercises",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof FitnessWorkoutLog] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const fitnessWorkoutLogWireSchema = z.strictObject({
  id: workoutShape.id,
  status: workoutShape.status,
  calendar_date: workoutShape.calendarDate,
  planned_session_id: workoutShape.plannedSessionId,
  title: workoutShape.title,
  started_at: workoutShape.startedAt,
  completed_at: workoutShape.completedAt,
  catalog_version: workoutShape.catalogVersion,
  logged_exercises: workoutShape.loggedExercises,
  recovery: workoutShape.recovery,
  deleted_at: workoutShape.deletedAt,
  fields_updated_at: workoutShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type FitnessWorkoutLogWire = z.infer<typeof fitnessWorkoutLogWireSchema>;

export function fitnessWorkoutLogToWire(
  log: FitnessWorkoutLog,
  serverUpdatedAt: string | null = null,
): FitnessWorkoutLogWire {
  const { fieldsUpdatedAt, ...rest } = log;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<FitnessWorkoutLogWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToFitnessWorkoutLog(wire: FitnessWorkoutLogWire): FitnessWorkoutLog {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return fitnessWorkoutLogSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as FitnessWorkoutLog;
}

const MERGED_WORKOUT_FIELDS = [
  "status",
  "calendar_date",
  "planned_session_id",
  "title",
  "started_at",
  "completed_at",
  "catalog_version",
  "logged_exercises",
  "recovery",
  "deleted_at",
] as const satisfies readonly (keyof FitnessWorkoutLogWire)[];

export function mergeFitnessWorkoutLog(
  local: FitnessWorkoutLogWire,
  remote: FitnessWorkoutLogWire,
): FitnessWorkoutLogWire {
  return mergeLwwWire(local, remote, MERGED_WORKOUT_FIELDS);
}

export function validateLoggedExercises(exercises: LoggedExercise[]): string | null {
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      const parsed = setRowSchema.safeParse(set);
      if (!parsed.success) return parsed.error.issues[0]?.message ?? "invalid set";
    }
  }
  return null;
}

export type FitnessSkipRecord = {
  id: string;
  calendarDate: string;
  plannedSessionId: string;
  note: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const skipShape = {
  id: z.uuid(),
  calendarDate: calendarDate,
  plannedSessionId: z.string().uuid(),
  note: z.string().max(2000).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const fitnessSkipRecordSchema = z.strictObject(skipShape);

const SKIP_SNAKE: Partial<Record<keyof FitnessSkipRecord, string>> = {
  calendarDate: "calendar_date",
  plannedSessionId: "planned_session_id",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const skipSnakeOf = (field: string): string => SKIP_SNAKE[field as keyof FitnessSkipRecord] ?? field;
const skipCamelOf = (field: string): string =>
  Object.fromEntries(Object.entries(SKIP_SNAKE).map(([c, s]) => [s, c]))[field] ?? field;

export const fitnessSkipRecordWireSchema = z.strictObject({
  id: skipShape.id,
  calendar_date: skipShape.calendarDate,
  planned_session_id: skipShape.plannedSessionId,
  note: skipShape.note,
  deleted_at: skipShape.deletedAt,
  fields_updated_at: skipShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type FitnessSkipRecordWire = z.infer<typeof fitnessSkipRecordWireSchema>;

export function fitnessSkipRecordToWire(
  record: FitnessSkipRecord,
  serverUpdatedAt: string | null = null,
): FitnessSkipRecordWire {
  const { fieldsUpdatedAt, ...rest } = record;
  return {
    ...(mapKeys(rest, skipSnakeOf) as Omit<FitnessSkipRecordWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, skipSnakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToFitnessSkipRecord(wire: FitnessSkipRecordWire): FitnessSkipRecord {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return fitnessSkipRecordSchema.parse({
    ...mapKeys(rest, skipCamelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, skipCamelOf),
  }) as FitnessSkipRecord;
}

const MERGED_SKIP_FIELDS = [
  "calendar_date",
  "planned_session_id",
  "note",
  "deleted_at",
] as const satisfies readonly (keyof FitnessSkipRecordWire)[];

export function mergeFitnessSkipRecord(
  local: FitnessSkipRecordWire,
  remote: FitnessSkipRecordWire,
): FitnessSkipRecordWire {
  return mergeLwwWire(local, remote, MERGED_SKIP_FIELDS);
}

export type FitnessUserSettings = {
  id: string;
  chargeUnit: "kg" | "lb";
  adherenceTrackingEnabled: boolean;
  adherenceMinWorkoutsPerWeek: number;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

export const FITNESS_SETTINGS_SINGLETON_ID = "ffffffff-ffff-4fff-8fff-ffffffff0001";

const settingsShape = {
  id: z.uuid(),
  chargeUnit: z.enum(["kg", "lb"]),
  adherenceTrackingEnabled: z.boolean(),
  adherenceMinWorkoutsPerWeek: z.number().int().min(1).max(14),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const fitnessUserSettingsSchema = z.strictObject(settingsShape);

const SETTINGS_SNAKE: Partial<Record<keyof FitnessUserSettings, string>> = {
  chargeUnit: "charge_unit",
  adherenceTrackingEnabled: "adherence_tracking_enabled",
  adherenceMinWorkoutsPerWeek: "adherence_min_workouts_per_week",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const settingsSnakeOf = (field: string): string =>
  SETTINGS_SNAKE[field as keyof FitnessUserSettings] ?? field;
const settingsCamelOf = (field: string): string =>
  Object.fromEntries(Object.entries(SETTINGS_SNAKE).map(([c, s]) => [s, c]))[field] ?? field;

export const fitnessUserSettingsWireSchema = z.strictObject({
  id: settingsShape.id,
  charge_unit: settingsShape.chargeUnit,
  adherence_tracking_enabled: settingsShape.adherenceTrackingEnabled,
  adherence_min_workouts_per_week: settingsShape.adherenceMinWorkoutsPerWeek,
  deleted_at: settingsShape.deletedAt,
  fields_updated_at: settingsShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type FitnessUserSettingsWire = z.infer<typeof fitnessUserSettingsWireSchema>;

export function fitnessUserSettingsToWire(
  settings: FitnessUserSettings,
  serverUpdatedAt: string | null = null,
): FitnessUserSettingsWire {
  const { fieldsUpdatedAt, ...rest } = settings;
  return {
    ...(mapKeys(rest, settingsSnakeOf) as Omit<
      FitnessUserSettingsWire,
      "fields_updated_at" | "server_updated_at"
    >),
    fields_updated_at: mapKeys(fieldsUpdatedAt, settingsSnakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToFitnessUserSettings(wire: FitnessUserSettingsWire): FitnessUserSettings {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return fitnessUserSettingsSchema.parse({
    ...mapKeys(rest, settingsCamelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, settingsCamelOf),
  }) as FitnessUserSettings;
}

const MERGED_SETTINGS_FIELDS = [
  "charge_unit",
  "adherence_tracking_enabled",
  "adherence_min_workouts_per_week",
  "deleted_at",
] as const satisfies readonly (keyof FitnessUserSettingsWire)[];

export function mergeFitnessUserSettings(
  local: FitnessUserSettingsWire,
  remote: FitnessUserSettingsWire,
): FitnessUserSettingsWire {
  return mergeLwwWire(local, remote, MERGED_SETTINGS_FIELDS);
}

export function defaultFitnessUserSettings(id: string = FITNESS_SETTINGS_SINGLETON_ID): FitnessUserSettings {
  return fitnessUserSettingsSchema.parse({
    id,
    chargeUnit: "kg",
    adherenceTrackingEnabled: false,
    adherenceMinWorkoutsPerWeek: 1,
    deletedAt: null,
    fieldsUpdatedAt: {},
  }) as FitnessUserSettings;
}

export function kgToDisplay(kg: number, unit: "kg" | "lb"): number {
  if (unit === "kg") return kg;
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function displayToKg(value: number, unit: "kg" | "lb"): number {
  if (unit === "kg") return value;
  return Math.round((value / 2.20462) * 100) / 100;
}
