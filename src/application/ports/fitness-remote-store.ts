import type { FitnessProgramWire } from "@/domain/fitness/program";
import type {
  FitnessSkipRecordWire,
  FitnessUserSettingsWire,
  FitnessWorkoutLogWire,
} from "@/domain/fitness/workout-log";

export type FitnessPullResult = {
  programs: FitnessProgramWire[];
  workoutLogs: FitnessWorkoutLogWire[];
  skipRecords: FitnessSkipRecordWire[];
  settings: FitnessUserSettingsWire[];
  cursor: string;
};

export type FitnessRemoteStore = {
  push(body: {
    programs: FitnessProgramWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }): Promise<FitnessPullResult>;
  pull(since: string | null, limit: number): Promise<FitnessPullResult>;
};
