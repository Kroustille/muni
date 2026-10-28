import type { MusicPracticeExerciseRepository } from "@/application/ports/music-practice-exercise-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  practiceExerciseSchema,
  validatePracticeExercise,
  type PracticeExercise,
} from "@/domain/practice-exercise";
import { createMusicPracticeHlc } from "./hlc";

export type PracticeExerciseUseCasesDeps = {
  exercises: MusicPracticeExerciseRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type PracticeExerciseUseCases = {
  listExercises(): Promise<PracticeExercise[]>;
  getExercise(id: string): Promise<PracticeExercise | undefined>;
  upsertExercise(exercise: PracticeExercise): Promise<PracticeExercise>;
  deleteExercise(id: string): Promise<PracticeExercise>;
  createQuick(input: { title: string; instrumentId?: string | null }): Promise<PracticeExercise>;
  restoreExercise(id: string): Promise<PracticeExercise>;
};

export function createPracticeExerciseUseCases(
  deps: PracticeExerciseUseCasesDeps,
): PracticeExerciseUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  return {
    listExercises: () => deps.exercises.list(),
    getExercise: (id) => deps.exercises.get(id),

    async createQuick(input) {
      const stamp = await hlc.nextFieldStamp();
      const exercise = practiceExerciseSchema.parse({
        id: deps.idGenerator.newId(),
        title: input.title.trim(),
        instrumentId: input.instrumentId ?? null,
        category: null,
        notes: null,
        deletedAt: null,
        fieldsUpdatedAt: { title: stamp },
      }) as PracticeExercise;
      const err = validatePracticeExercise(exercise);
      if (err !== null) throw new Error(err);
      return deps.exercises.upsert(exercise);
    },

    async upsertExercise(exercise) {
      const err = validatePracticeExercise(exercise);
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      return deps.exercises.upsert(
        practiceExerciseSchema.parse({
          ...exercise,
          fieldsUpdatedAt: { ...exercise.fieldsUpdatedAt, title: stamp },
        }) as PracticeExercise,
      );
    },

    async deleteExercise(id) {
      const current = await deps.exercises.get(id);
      if (current === undefined) throw new Error("exercise not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.exercises.upsert(
        practiceExerciseSchema.parse({
          ...current,
          deletedAt: new Date(deps.now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as PracticeExercise,
      );
    },

    async restoreExercise(id) {
      const current = await deps.exercises.get(id);
      if (current === undefined) throw new Error("exercise not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.exercises.upsert(
        practiceExerciseSchema.parse({
          ...current,
          deletedAt: null,
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as PracticeExercise,
      );
    },
  };
}
