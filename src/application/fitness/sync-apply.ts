import {
  fitnessProgramToWire,
  wireToFitnessProgram,
  type FitnessProgramWire,
} from "@/domain/fitness/program";
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
import type { FitnessProgramRepository } from "@/application/ports/fitness-program-repository";
import type { FitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import type { FitnessSettingsRepository } from "@/application/ports/fitness-settings-repository";
import type { FitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";

export type FitnessSyncApplyDeps = {
  programs: FitnessProgramRepository;
  workouts: FitnessWorkoutRepository;
  skips: FitnessSkipRepository;
  settings: FitnessSettingsRepository;
};

export type FitnessSyncApply = {
  applyRemote(payload: {
    programs: FitnessProgramWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }): Promise<void>;
  collectPushPayload(): Promise<{
    programs: FitnessProgramWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }>;
  clearOutboxes(payload: {
    programIds: string[];
    workoutIds: string[];
    skipIds: string[];
    settingsIds: string[];
  }): Promise<void>;
};

export function createFitnessSyncApply(deps: FitnessSyncApplyDeps): FitnessSyncApply {
  return {
    async applyRemote(payload) {
      for (const wire of payload.programs) {
        await deps.programs.upsert(wireToFitnessProgram(wire), { enqueue: false });
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
      const [programIds, workoutIds, skipIds, settingsIds] = await Promise.all([
        deps.programs.outbox(),
        deps.workouts.outbox(),
        deps.skips.outbox(),
        deps.settings.outbox(),
      ]);
      const programs = (
        await Promise.all(programIds.map((id) => deps.programs.get(id)))
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
        programs: programs.map((p) => fitnessProgramToWire(p)),
        workoutLogs: workoutLogs.map((l) => fitnessWorkoutLogToWire(l)),
        skipRecords: skipRecords.map((s) => fitnessSkipRecordToWire(s)),
        settings: settings.map((s) => fitnessUserSettingsToWire(s)),
      };
    },

    async clearOutboxes(payload) {
      await Promise.all([
        deps.programs.clearOutbox(payload.programIds),
        deps.workouts.clearOutbox(payload.workoutIds),
        deps.skips.clearOutbox(payload.skipIds),
        deps.settings.clearOutbox(payload.settingsIds),
      ]);
    },
  };
}
