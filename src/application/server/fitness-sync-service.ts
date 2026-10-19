import {
  fitnessProgramToWire,
  fitnessProgramWireSchema,
  mergeFitnessProgram,
  wireToFitnessProgram,
  type FitnessProgramWire,
} from "@/domain/fitness/program";
import {
  fitnessSkipRecordToWire,
  fitnessSkipRecordWireSchema,
  fitnessUserSettingsToWire,
  fitnessUserSettingsWireSchema,
  fitnessWorkoutLogToWire,
  fitnessWorkoutLogWireSchema,
  mergeFitnessSkipRecord,
  mergeFitnessUserSettings,
  mergeFitnessWorkoutLog,
  wireToFitnessSkipRecord,
  wireToFitnessUserSettings,
  wireToFitnessWorkoutLog,
  type FitnessSkipRecordWire,
  type FitnessUserSettingsWire,
  type FitnessWorkoutLogWire,
} from "@/domain/fitness/workout-log";
import type { ServerFitnessProgramRepository } from "@/application/ports/fitness-program-repository";
import type { ServerFitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import type { ServerFitnessSettingsRepository } from "@/application/ports/fitness-settings-repository";
import type { ServerFitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type FitnessSyncService = {
  push(
    userId: string,
    body: {
      programs: FitnessProgramWire[];
      workoutLogs: FitnessWorkoutLogWire[];
      skipRecords: FitnessSkipRecordWire[];
      settings: FitnessUserSettingsWire[];
    },
  ): Promise<{
    programs: FitnessProgramWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{
    programs: FitnessProgramWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
    cursor: string;
  }>;
};

type FitnessSyncServiceDeps = {
  programs: ServerFitnessProgramRepository;
  workouts: ServerFitnessWorkoutRepository;
  skips: ServerFitnessSkipRepository;
  settings: ServerFitnessSettingsRepository;
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

export function validatePushFitness(body: {
  programs?: unknown[];
  workoutLogs?: unknown[];
  skipRecords?: unknown[];
  settings?: unknown[];
}): {
  programs: FitnessProgramWire[];
  workoutLogs: FitnessWorkoutLogWire[];
  skipRecords: FitnessSkipRecordWire[];
  settings: FitnessUserSettingsWire[];
} {
  return {
    programs: validateWireArray(body.programs ?? [], "program", fitnessProgramWireSchema),
    workoutLogs: validateWireArray(body.workoutLogs ?? [], "workout", fitnessWorkoutLogWireSchema),
    skipRecords: validateWireArray(body.skipRecords ?? [], "skip", fitnessSkipRecordWireSchema),
    settings: validateWireArray(body.settings ?? [], "settings", fitnessUserSettingsWireSchema),
  };
}

function serverUpdatedAtIso(now: () => Date): string {
  return now().toISOString();
}

async function pushPrograms(
  userId: string,
  repo: ServerFitnessProgramRepository,
  incoming: FitnessProgramWire[],
  now: () => Date,
): Promise<FitnessProgramWire[]> {
  return repo.transaction(async (programs) => {
    const results: FitnessProgramWire[] = [];
    for (const row of incoming) {
      const locked = await programs.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: FitnessProgramWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = fitnessProgramToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeFitnessProgram(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await programs.upsert(userId, wireToFitnessProgram(merged));
      results.push(fitnessProgramToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushWorkouts(
  userId: string,
  repo: ServerFitnessWorkoutRepository,
  incoming: FitnessWorkoutLogWire[],
  now: () => Date,
): Promise<FitnessWorkoutLogWire[]> {
  return repo.transaction(async (workouts) => {
    const results: FitnessWorkoutLogWire[] = [];
    for (const row of incoming) {
      const locked = await workouts.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: FitnessWorkoutLogWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = fitnessWorkoutLogToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeFitnessWorkoutLog(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await workouts.upsert(userId, wireToFitnessWorkoutLog(merged));
      results.push(fitnessWorkoutLogToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushSkips(
  userId: string,
  repo: ServerFitnessSkipRepository,
  incoming: FitnessSkipRecordWire[],
  now: () => Date,
): Promise<FitnessSkipRecordWire[]> {
  return repo.transaction(async (skips) => {
    const results: FitnessSkipRecordWire[] = [];
    for (const row of incoming) {
      const locked = await skips.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: FitnessSkipRecordWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = fitnessSkipRecordToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeFitnessSkipRecord(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await skips.upsert(userId, wireToFitnessSkipRecord(merged));
      results.push(fitnessSkipRecordToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushSettings(
  userId: string,
  repo: ServerFitnessSettingsRepository,
  incoming: FitnessUserSettingsWire[],
  now: () => Date,
): Promise<FitnessUserSettingsWire[]> {
  return repo.transaction(async (settings) => {
    const results: FitnessUserSettingsWire[] = [];
    for (const row of incoming) {
      const locked = await settings.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: FitnessUserSettingsWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = fitnessUserSettingsToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeFitnessUserSettings(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await settings.upsert(userId, wireToFitnessUserSettings(merged));
      results.push(fitnessUserSettingsToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

export function createFitnessSyncService(deps: FitnessSyncServiceDeps): FitnessSyncService {
  const now = deps.now ?? (() => new Date());

  return {
    async push(userId, body) {
      assertUserId(userId);
      const validated = validatePushFitness(body);
      const [programs, workoutLogs, skipRecords, settings] = await Promise.all([
        pushPrograms(userId, deps.programs, validated.programs, now),
        pushWorkouts(userId, deps.workouts, validated.workoutLogs, now),
        pushSkips(userId, deps.skips, validated.skipRecords, now),
        pushSettings(userId, deps.settings, validated.settings, now),
      ]);
      return { programs, workoutLogs, skipRecords, settings };
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const sinceDate = since === null ? null : new Date(since);
      const [programs, workoutLogs, skipRecords, settings] = await Promise.all([
        deps.programs.pullSince(userId, sinceDate, limit),
        deps.workouts.pullSince(userId, sinceDate, limit),
        deps.skips.pullSince(userId, sinceDate, limit),
        deps.settings.pullSince(userId, sinceDate, limit),
      ]);
      const programWires = programs.map((p) => fitnessProgramToWire(p));
      const workoutWires = workoutLogs.map((l) => fitnessWorkoutLogToWire(l));
      const skipWires = skipRecords.map((s) => fitnessSkipRecordToWire(s));
      const settingsWires = settings.map((s) => fitnessUserSettingsToWire(s));
      const cursors = [
        ...programWires.map((w) => w.server_updated_at),
        ...workoutWires.map((w) => w.server_updated_at),
        ...skipWires.map((w) => w.server_updated_at),
        ...settingsWires.map((w) => w.server_updated_at),
      ].filter((c): c is string => typeof c === "string");
      const cursor = cursors.sort().at(-1) ?? since ?? "";
      return { programs: programWires, workoutLogs: workoutWires, skipRecords: skipWires, settings: settingsWires, cursor };
    },
  };
}
