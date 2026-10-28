import type { FitnessSessionTemplateWire } from "@/domain/fitness/session-template";
import type { FitnessScheduledSessionWire } from "@/domain/fitness/scheduled-session";
import type {
  FitnessSkipRecordWire,
  FitnessUserSettingsWire,
  FitnessWorkoutLogWire,
} from "@/domain/fitness/workout-log";

export type FitnessPullResult = {
  sessionTemplates: FitnessSessionTemplateWire[];
  scheduledSessions: FitnessScheduledSessionWire[];
  workoutLogs: FitnessWorkoutLogWire[];
  skipRecords: FitnessSkipRecordWire[];
  settings: FitnessUserSettingsWire[];
  cursor: string;
};

export type FitnessRemoteStore = {
  push(body: {
    sessionTemplates: FitnessSessionTemplateWire[];
    scheduledSessions: FitnessScheduledSessionWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }): Promise<FitnessPullResult>;
  pull(since: string | null, limit: number): Promise<FitnessPullResult>;
};
