import {
  fitnessSessionTemplateToWire,
  fitnessSessionTemplateWireSchema,
  mergeFitnessSessionTemplate,
  wireToFitnessSessionTemplate,
  type FitnessSessionTemplateWire,
} from "@/domain/fitness/session-template";
import {
  fitnessScheduledSessionToWire,
  fitnessScheduledSessionWireSchema,
  mergeFitnessScheduledSession,
  wireToFitnessScheduledSession,
  type FitnessScheduledSessionWire,
} from "@/domain/fitness/scheduled-session";
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
import type { ServerFitnessSessionTemplateRepository } from "@/application/ports/fitness-session-template-repository";
import type { ServerFitnessScheduledSessionRepository } from "@/application/ports/fitness-scheduled-session-repository";
import type { ServerFitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import type { ServerFitnessSettingsRepository } from "@/application/ports/fitness-settings-repository";
import type { ServerFitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type FitnessSyncService = {
  push(
    userId: string,
    body: {
      sessionTemplates: FitnessSessionTemplateWire[];
      scheduledSessions: FitnessScheduledSessionWire[];
      workoutLogs: FitnessWorkoutLogWire[];
      skipRecords: FitnessSkipRecordWire[];
      settings: FitnessUserSettingsWire[];
    },
  ): Promise<{
    sessionTemplates: FitnessSessionTemplateWire[];
    scheduledSessions: FitnessScheduledSessionWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{
    sessionTemplates: FitnessSessionTemplateWire[];
    scheduledSessions: FitnessScheduledSessionWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
    cursor: string;
  }>;
};

type FitnessSyncServiceDeps = {
  templates: ServerFitnessSessionTemplateRepository;
  scheduled: ServerFitnessScheduledSessionRepository;
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
  sessionTemplates?: unknown[];
  scheduledSessions?: unknown[];
  workoutLogs?: unknown[];
  skipRecords?: unknown[];
  settings?: unknown[];
}): {
  sessionTemplates: FitnessSessionTemplateWire[];
  scheduledSessions: FitnessScheduledSessionWire[];
  workoutLogs: FitnessWorkoutLogWire[];
  skipRecords: FitnessSkipRecordWire[];
  settings: FitnessUserSettingsWire[];
} {
  return {
    sessionTemplates: validateWireArray(body.sessionTemplates ?? [], "sessionTemplate", fitnessSessionTemplateWireSchema),
    scheduledSessions: validateWireArray(body.scheduledSessions ?? [], "scheduledSession", fitnessScheduledSessionWireSchema),
    workoutLogs: validateWireArray(body.workoutLogs ?? [], "workout", fitnessWorkoutLogWireSchema),
    skipRecords: validateWireArray(body.skipRecords ?? [], "skip", fitnessSkipRecordWireSchema),
    settings: validateWireArray(body.settings ?? [], "settings", fitnessUserSettingsWireSchema),
  };
}

function serverUpdatedAtIso(now: () => Date): string {
  return now().toISOString();
}

async function pushMerged<TWire extends { id: string; server_updated_at?: string | null }, TDomain>(
  userId: string,
  incoming: TWire[],
  now: () => Date,
  repo: {
    transaction: <R>(fn: (inner: typeof repo) => Promise<R>) => Promise<R>;
    findByIds: (userId: string, ids: string[]) => Promise<TDomain[]>;
    upsert: (userId: string, domain: TDomain) => Promise<TDomain>;
  },
  toWire: (domain: TDomain, serverUpdatedAt?: string | null) => TWire,
  fromWire: (wire: TWire) => TDomain,
  merge: (local: TWire, remote: TWire) => TWire,
): Promise<TWire[]> {
  return repo.transaction(async (inner) => {
    const results: TWire[] = [];
    for (const row of incoming) {
      const locked = await inner.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: TWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = toWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : { ...merge(row, existingWire), server_updated_at: serverUpdatedAtIso(now) };
      }
      const saved = await inner.upsert(userId, fromWire(merged));
      results.push(toWire(saved, merged.server_updated_at ?? null));
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
      const [sessionTemplates, scheduledSessions, workoutLogs, skipRecords, settings] = await Promise.all([
        pushMerged(
          userId,
          validated.sessionTemplates,
          now,
          deps.templates,
          fitnessSessionTemplateToWire,
          wireToFitnessSessionTemplate,
          mergeFitnessSessionTemplate,
        ),
        pushMerged(
          userId,
          validated.scheduledSessions,
          now,
          deps.scheduled,
          fitnessScheduledSessionToWire,
          wireToFitnessScheduledSession,
          mergeFitnessScheduledSession,
        ),
        pushMerged(
          userId,
          validated.workoutLogs,
          now,
          deps.workouts,
          fitnessWorkoutLogToWire,
          wireToFitnessWorkoutLog,
          mergeFitnessWorkoutLog,
        ),
        pushMerged(
          userId,
          validated.skipRecords,
          now,
          deps.skips,
          fitnessSkipRecordToWire,
          wireToFitnessSkipRecord,
          mergeFitnessSkipRecord,
        ),
        pushMerged(
          userId,
          validated.settings,
          now,
          deps.settings,
          fitnessUserSettingsToWire,
          wireToFitnessUserSettings,
          mergeFitnessUserSettings,
        ),
      ]);
      return { sessionTemplates, scheduledSessions, workoutLogs, skipRecords, settings };
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const sinceDate = since === null ? null : new Date(since);
      const [sessionTemplates, scheduledSessions, workoutLogs, skipRecords, settings] = await Promise.all([
        deps.templates.pullSince(userId, sinceDate, limit),
        deps.scheduled.pullSince(userId, sinceDate, limit),
        deps.workouts.pullSince(userId, sinceDate, limit),
        deps.skips.pullSince(userId, sinceDate, limit),
        deps.settings.pullSince(userId, sinceDate, limit),
      ]);
      const templateWires = sessionTemplates.map((p) => fitnessSessionTemplateToWire(p));
      const scheduledWires = scheduledSessions.map((p) => fitnessScheduledSessionToWire(p));
      const workoutWires = workoutLogs.map((l) => fitnessWorkoutLogToWire(l));
      const skipWires = skipRecords.map((s) => fitnessSkipRecordToWire(s));
      const settingsWires = settings.map((s) => fitnessUserSettingsToWire(s));
      const cursors = [
        ...templateWires.map((w) => w.server_updated_at),
        ...scheduledWires.map((w) => w.server_updated_at),
        ...workoutWires.map((w) => w.server_updated_at),
        ...skipWires.map((w) => w.server_updated_at),
        ...settingsWires.map((w) => w.server_updated_at),
      ].filter((c): c is string => typeof c === "string");
      const cursor = cursors.sort().at(-1) ?? since ?? "";
      return {
        sessionTemplates: templateWires,
        scheduledSessions: scheduledWires,
        workoutLogs: workoutWires,
        skipRecords: skipWires,
        settings: settingsWires,
        cursor,
      };
    },
  };
}
