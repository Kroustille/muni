import type { MusicCompositionWire } from "@/domain/music-composition";
import type { DjSetWire } from "@/domain/dj-set";
import type { PracticeInstrumentWire } from "@/domain/practice-instrument";
import type { PracticeExerciseWire } from "@/domain/practice-exercise";
import type { PracticePlanWire } from "@/domain/practice-plan";
import type { PracticeLogWire } from "@/domain/practice-log";
import type { LearningPieceWire } from "@/domain/learning-piece";

export type MusicPracticeSyncPayload = {
  compositions: MusicCompositionWire[];
  djSets: DjSetWire[];
  instruments: PracticeInstrumentWire[];
  exercises: PracticeExerciseWire[];
  plans: PracticePlanWire[];
  logs: PracticeLogWire[];
  learningPieces: LearningPieceWire[];
};

export type MusicPracticePullResult = MusicPracticeSyncPayload & { cursor: string };

export type MusicPracticeRemoteStore = {
  push(body: MusicPracticeSyncPayload): Promise<MusicPracticePullResult>;
  pull(since: string | null, limit: number): Promise<MusicPracticePullResult>;
};
