import type { DjSet } from "@/domain/dj-set";
import type { LearningPiece } from "@/domain/learning-piece";
import type { MusicComposition } from "@/domain/music-composition";
import type { PracticeExercise } from "@/domain/practice-exercise";
import type { PracticeInstrument } from "@/domain/practice-instrument";
import type { PracticeLog } from "@/domain/practice-log";
import type { PracticePlan, PlanAssignment } from "@/domain/practice-plan";

const STAMP = "2026-01-01T12:00:00.000Z-0-dev";

export function buildMusicComposition(
  overrides: Partial<MusicComposition> = {},
): MusicComposition {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Test composition",
    status: "idea",
    startedAt: null,
    finishedAt: null,
    lastWorkedAt: null,
    genreStyle: null,
    tempoBpm: null,
    mood: null,
    notes: null,
    externalUrl: null,
    sessionNotes: [],
    linkedTrackIds: null,
    deletedAt: null,
    fieldsUpdatedAt: { title: STAMP },
    ...overrides,
  };
}

export function buildDjSet(overrides: Partial<DjSet> = {}): DjSet {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Club night",
    status: "planned",
    performedAt: null,
    venue: null,
    durationMinutes: null,
    genreStyle: null,
    bpmRange: null,
    mood: null,
    notes: null,
    setlist: [],
    externalUrl: null,
    deletedAt: null,
    fieldsUpdatedAt: { title: STAMP },
    ...overrides,
  };
}

export function buildPracticeInstrument(
  overrides: Partial<PracticeInstrument> = {},
): PracticeInstrument {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Piano",
    notes: null,
    deletedAt: null,
    fieldsUpdatedAt: { name: STAMP },
    ...overrides,
  };
}

export function buildPracticeExercise(overrides: Partial<PracticeExercise> = {}): PracticeExercise {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Gamme do majeur",
    instrumentId: null,
    category: "gamme",
    notes: null,
    deletedAt: null,
    fieldsUpdatedAt: { title: STAMP },
    ...overrides,
  };
}

export function buildPlanAssignment(overrides: Partial<PlanAssignment> = {}): PlanAssignment {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    exerciseId: "44444444-4444-4444-8444-444444444444",
    weekdays: [1, 3, 5],
    specificDates: null,
    sortOrder: 0,
    ...overrides,
  };
}

export function buildPracticePlan(overrides: Partial<PracticePlan> = {}): PracticePlan {
  return {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Plan semaine",
    isActive: true,
    assignments: [buildPlanAssignment()],
    deletedAt: null,
    fieldsUpdatedAt: { name: STAMP },
    ...overrides,
  };
}

export function buildPracticeLog(overrides: Partial<PracticeLog> = {}): PracticeLog {
  return {
    id: "77777777-7777-4777-8777-777777777777",
    practicedAt: "2026-01-01",
    practiceKind: "structured",
    instrumentId: null,
    exerciseIds: [],
    learningPieceId: null,
    durationMinutes: null,
    notes: null,
    deletedAt: null,
    fieldsUpdatedAt: { practicedAt: STAMP },
    ...overrides,
  };
}

export function buildLearningPiece(overrides: Partial<LearningPiece> = {}): LearningPiece {
  return {
    id: "88888888-8888-4888-8888-888888888888",
    title: "Für Elise",
    instrumentId: null,
    status: "learning",
    linkedTrackId: null,
    startedAt: null,
    lastPracticedAt: null,
    notes: null,
    deletedAt: null,
    fieldsUpdatedAt: { title: STAMP },
    ...overrides,
  };
}
