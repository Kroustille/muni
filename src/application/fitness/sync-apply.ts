import {
  fitnessSessionTemplateToWire,
  wireToFitnessSessionTemplate,
  type FitnessSessionTemplateWire,
} from "@/domain/fitness/session-template";
import {
  fitnessScheduledSessionToWire,
  wireToFitnessScheduledSession,
  type FitnessScheduledSessionWire,
} from "@/domain/fitness/scheduled-session";
import {
  fitnessSkipRecordToWire,
  fitnessUserSettingsToWire,
  fitnessWorkoutLogToWire,
  wireToFitnessSkipRecord,
  wireToFitnessUserSettings,
  wireToFitnessWorkoutLog,
  type FitnessSkipRecordWire,
  type FitnessUserSettingsWire,
  type FitnessWorkoutLogWire,
} from "@/domain/fitness/workout-log";
import type { FitnessSessionTemplateRepository } from "@/application/ports/fitness-session-template-repository";
import type { FitnessScheduledSessionRepository } from "@/application/ports/fitness-scheduled-session-repository";
import type { FitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import type { FitnessSettingsRepository } from "@/application/ports/fitness-settings-repository";
import type { FitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";

export type FitnessSyncApply = {
  applyRemote(payload: {
    sessionTemplates: FitnessSessionTemplateWire[];
    scheduledSessions: FitnessScheduledSessionWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }): Promise<void>;
  collectPushPayload(): Promise<{
    sessionTemplates: FitnessSessionTemplateWire[];
    scheduledSessions: FitnessScheduledSessionWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }>;
  clearOutboxes(payload: {
    sessionTemplateIds: string[];
    scheduledSessionIds: string[];
    workoutIds: string[];
    skipIds: string[];
    settingsIds: string[];
  }): Promise<void>;
};

export function createFitnessSyncApply(deps: {
  templates: FitnessSessionTemplateRepository;
  scheduled: FitnessScheduledSessionRepository;
  workouts: FitnessWorkoutRepository;
  skips: FitnessSkipRepository;
  settings: FitnessSettingsRepository;
}): FitnessSyncApply {
  return {
    async applyRemote(payload) {
      for (const wire of payload.sessionTemplates) {
        await deps.templates.upsert(wireToFitnessSessionTemplate(wire), { enqueue: false });
      }
      for (const wire of payload.scheduledSessions) {
        await deps.scheduled.upsert(wireToFitnessScheduledSession(wire), { enqueue: false });
      }
      for (const wire of payload.workoutLogs) {
        await deps.workouts.upsert(wireToFitnessWorkoutLog(wire), { enqueue: false });
      }
      for (const wire of payload.skipRecords) {
        await deps.skips.upsert(wireToFitnessSkipRecord(wire), { enqueue: false });
      }
      for (const wire of payload.settings) {
        await deps.settings.upsert(wireToFitnessUserSettings(wire), { enqueue: false });
      }
    },

    async collectPushPayload() {
      const [templateIds, scheduledIds, workoutIds, skipIds, settingsIds] = await Promise.all([
        deps.templates.outbox(),
        deps.scheduled.outbox(),
        deps.workouts.outbox(),
        deps.skips.outbox(),
        deps.settings.outbox(),
      ]);
      const sessionTemplates = (
        await Promise.all(templateIds.map((id) => deps.templates.get(id)))
      ).filter((p): p is NonNullable<typeof p> => p !== undefined);
      const scheduledSessions = (
        await Promise.all(scheduledIds.map((id) => deps.scheduled.get(id)))
      ).filter((p): p is NonNullable<typeof p> => p !== undefined);
      const workoutLogs = (
        await Promise.all(workoutIds.map((id) => deps.workouts.get(id)))
      ).filter((l): l is NonNullable<typeof l> => l !== undefined);
      const skipRecords = (
        await Promise.all(skipIds.map((id) => deps.skips.get(id)))
      ).filter((s): s is NonNullable<typeof s> => s !== undefined);
      const settingsRow = settingsIds.length > 0 ? await deps.settings.get() : undefined;
      const settings = settingsRow !== undefined ? [settingsRow] : [];
      return {
        sessionTemplates: sessionTemplates.map((p) => fitnessSessionTemplateToWire(p)),
        scheduledSessions: scheduledSessions.map((p) => fitnessScheduledSessionToWire(p)),
        workoutLogs: workoutLogs.map((l) => fitnessWorkoutLogToWire(l)),
        skipRecords: skipRecords.map((s) => fitnessSkipRecordToWire(s)),
        settings: settings.map((s) => fitnessUserSettingsToWire(s)),
      };
    },

    async clearOutboxes(payload) {
      await Promise.all([
        deps.templates.clearOutbox(payload.sessionTemplateIds),
        deps.scheduled.clearOutbox(payload.scheduledSessionIds),
        deps.workouts.clearOutbox(payload.workoutIds),
        deps.skips.clearOutbox(payload.skipIds),
        deps.settings.clearOutbox(payload.settingsIds),
      ]);
    },
  };
}
