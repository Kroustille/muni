import type { FitnessSessionTemplate } from "@/domain/fitness/session-template";
import type { FitnessScheduledSession } from "@/domain/fitness/scheduled-session";
import type { FitnessSessionTemplateRepository } from "@/application/ports/fitness-session-template-repository";
import type { FitnessScheduledSessionRepository } from "@/application/ports/fitness-scheduled-session-repository";
import type { FitnessSkipRepository } from "@/application/ports/fitness-skip-repository";
import type {
  FitnessSettingsRepository,
  FitnessExerciseCatalogStore,
} from "@/application/ports/fitness-settings-repository";
import type { FitnessWorkoutRepository } from "@/application/ports/fitness-workout-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { MetaStore } from "@/application/ports/item-repository";
import {
  defaultFitnessUserSettings,
  fitnessSkipRecordSchema,
  fitnessWorkoutLogSchema,
  validateLoggedExercises,
  type FitnessWorkoutLog,
  type LoggedExercise,
} from "@/domain/fitness/workout-log";
import { createFitnessHlc } from "./hlc";
import { localCalendarDate } from "./today";

export type FitnessWorkoutUseCasesDeps = {
  workouts: FitnessWorkoutRepository;
  templates: FitnessSessionTemplateRepository;
  scheduled: FitnessScheduledSessionRepository;
  skips: FitnessSkipRepository;
  settings: FitnessSettingsRepository;
  catalog: FitnessExerciseCatalogStore;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type FitnessWorkoutUseCases = {
  getWorkout(id: string): Promise<FitnessWorkoutLog | undefined>;
  listWorkouts(): Promise<FitnessWorkoutLog[]>;
  listSkips(): Promise<import("@/domain/fitness/workout-log").FitnessSkipRecord[]>;
  startWorkoutFromTemplate(
    template: FitnessSessionTemplate,
    scheduled?: FitnessScheduledSession,
  ): Promise<FitnessWorkoutLog>;
  startFreeWorkout(): Promise<FitnessWorkoutLog>;
  completeWorkout(id: string): Promise<FitnessWorkoutLog>;
  abandonWorkout(id: string): Promise<FitnessWorkoutLog>;
  skipScheduledSession(scheduledSessionId: string, note?: string): Promise<void>;
  updateLoggedExercises(id: string, loggedExercises: LoggedExercise[]): Promise<FitnessWorkoutLog>;
  updateRecovery(id: string, recovery: FitnessWorkoutLog["recovery"]): Promise<FitnessWorkoutLog>;
  duplicateWorkoutAsTemplate(sourceId: string): Promise<FitnessWorkoutLog>;
  deleteWorkout(id: string): Promise<void>;
  applyRemoteWorkouts(rows: FitnessWorkoutLog[]): Promise<void>;
};

async function catalogVersion(catalog: FitnessExerciseCatalogStore): Promise<number> {
  return (await catalog.getVersion()) ?? 1;
}

async function ensureSettings(settings: FitnessSettingsRepository): Promise<void> {
  const row = await settings.get();
  if (row === undefined) {
    await settings.upsert(defaultFitnessUserSettings());
  }
}

function exercisesFromTemplate(
  template: FitnessSessionTemplate,
  catalog: FitnessExerciseCatalogStore,
): Promise<LoggedExercise[]> {
  return Promise.all(
    template.templateExercises.map(async (planned) => {
      const entry = await catalog.getById(planned.exerciseId);
      const nameFr = entry?.nameFr ?? planned.exerciseId;
      const setCount = planned.defaultSetCount ?? 1;
      const sets = Array.from({ length: setCount }, () => ({
        reps: planned.targetReps,
      }));
      return {
        exerciseId: planned.exerciseId,
        nameFrSnapshot: nameFr,
        sets,
      };
    }),
  );
}

export function createFitnessWorkoutUseCases(
  deps: FitnessWorkoutUseCasesDeps,
): FitnessWorkoutUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);
  const assertSingleInProgress = async (): Promise<void> => {
    const existing = await deps.workouts.getInProgress();
    if (existing !== undefined) {
      throw new Error("WORKOUT_IN_PROGRESS");
    }
  };

  return {
    getWorkout: (id) => deps.workouts.get(id),
    listWorkouts: () => deps.workouts.list(),
    listSkips: () => deps.skips.list(),

    async startWorkoutFromTemplate(template, scheduled) {
      await assertSingleInProgress();
      await ensureSettings(deps.settings);
      const stamp = await hlc.nextFieldStamp();
      const version = await catalogVersion(deps.catalog);
      const calendarDate = localCalendarDate(deps.now());
      const loggedExercises = await exercisesFromTemplate(template, deps.catalog);
      const log = fitnessWorkoutLogSchema.parse({
        id: deps.idGenerator.newId(),
        status: "in_progress",
        calendarDate,
        sessionTemplateId: template.id,
        scheduledSessionId: scheduled?.id ?? null,
        title: template.title,
        startedAt: new Date(deps.now()).toISOString(),
        completedAt: null,
        catalogVersion: version,
        loggedExercises,
        recovery: null,
        deletedAt: null,
        fieldsUpdatedAt: { status: stamp, loggedExercises: stamp, title: stamp },
      }) as FitnessWorkoutLog;
      return deps.workouts.upsert(log);
    },

    async startFreeWorkout() {
      await assertSingleInProgress();
      await ensureSettings(deps.settings);
      const stamp = await hlc.nextFieldStamp();
      const version = await catalogVersion(deps.catalog);
      const log = fitnessWorkoutLogSchema.parse({
        id: deps.idGenerator.newId(),
        status: "in_progress",
        calendarDate: localCalendarDate(deps.now()),
        sessionTemplateId: null,
        scheduledSessionId: null,
        title: "Séance libre",
        startedAt: new Date(deps.now()).toISOString(),
        completedAt: null,
        catalogVersion: version,
        loggedExercises: [],
        recovery: null,
        deletedAt: null,
        fieldsUpdatedAt: { status: stamp, title: stamp },
      }) as FitnessWorkoutLog;
      return deps.workouts.upsert(log);
    },

    async completeWorkout(id) {
      const current = await deps.workouts.get(id);
      if (current === undefined) throw new Error("workout not found");
      const stamp = await hlc.nextFieldStamp();
      const next = {
        ...current,
        status: "completed" as const,
        completedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, status: stamp, completedAt: stamp },
      };
      const saved = await deps.workouts.upsert(
        fitnessWorkoutLogSchema.parse(next) as FitnessWorkoutLog,
      );

      if (saved.scheduledSessionId !== null) {
        const scheduled = await deps.scheduled.get(saved.scheduledSessionId);
        if (scheduled !== undefined && scheduled.deletedAt === null) {
          let templateExercisesSnapshot = scheduled.templateExercisesSnapshot;
          if (saved.sessionTemplateId !== null) {
            const template = await deps.templates.get(saved.sessionTemplateId);
            if (
              saved.loggedExercises.length === 0 &&
              template !== undefined &&
              templateExercisesSnapshot === null
            ) {
              templateExercisesSnapshot = template.templateExercises;
            }
          }
          const scheduledStamp = await hlc.nextFieldStamp();
          const scheduledFields: Record<string, string> = {
            ...scheduled.fieldsUpdatedAt,
            titleSnapshot: scheduledStamp,
          };
          if (templateExercisesSnapshot !== scheduled.templateExercisesSnapshot) {
            scheduledFields.templateExercisesSnapshot = scheduledStamp;
          }
          await deps.scheduled.upsert({
            ...scheduled,
            titleSnapshot: saved.title,
            templateExercisesSnapshot,
            fieldsUpdatedAt: scheduledFields,
          });
        }
      }

      return saved;
    },

    async abandonWorkout(id) {
      const current = await deps.workouts.get(id);
      if (current === undefined) throw new Error("workout not found");
      const stamp = await hlc.nextFieldStamp();
      const next = {
        ...current,
        status: "abandoned" as const,
        completedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, status: stamp, completedAt: stamp },
      };
      return deps.workouts.upsert(fitnessWorkoutLogSchema.parse(next) as FitnessWorkoutLog);
    },

    async skipScheduledSession(scheduledSessionId, note) {
      const scheduled = await deps.scheduled.get(scheduledSessionId);
      if (scheduled === undefined || scheduled.deletedAt !== null) {
        throw new Error("scheduled session not found");
      }
      const template = await deps.templates.get(scheduled.sessionTemplateId);
      const titleSnapshot = template?.title ?? scheduled.titleSnapshot ?? "Séance";
      const stamp = await hlc.nextFieldStamp();
      const record = fitnessSkipRecordSchema.parse({
        id: deps.idGenerator.newId(),
        calendarDate: scheduled.calendarDate,
        scheduledSessionId,
        sessionTemplateId: scheduled.sessionTemplateId,
        titleSnapshot,
        note: note?.trim() || null,
        deletedAt: null,
        fieldsUpdatedAt: { scheduledSessionId: stamp, calendarDate: stamp, titleSnapshot: stamp },
      });
      await deps.skips.upsert(record);
      if (scheduled.titleSnapshot === null) {
        await deps.scheduled.upsert({
          ...scheduled,
          titleSnapshot,
          fieldsUpdatedAt: { ...scheduled.fieldsUpdatedAt, titleSnapshot: stamp },
        });
      }
    },

    async updateLoggedExercises(id, loggedExercises) {
      const validationError = validateLoggedExercises(loggedExercises);
      if (validationError !== null) throw new Error(validationError);
      const current = await deps.workouts.get(id);
      if (current === undefined) throw new Error("workout not found");
      const stamp = await hlc.nextFieldStamp();
      const next = {
        ...current,
        loggedExercises,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, loggedExercises: stamp },
      };
      return deps.workouts.upsert(fitnessWorkoutLogSchema.parse(next) as FitnessWorkoutLog);
    },

    async updateRecovery(id, recovery) {
      const current = await deps.workouts.get(id);
      if (current === undefined) throw new Error("workout not found");
      const stamp = await hlc.nextFieldStamp();
      const next = {
        ...current,
        recovery,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, recovery: stamp },
      };
      return deps.workouts.upsert(fitnessWorkoutLogSchema.parse(next) as FitnessWorkoutLog);
    },

    async duplicateWorkoutAsTemplate(sourceId) {
      await assertSingleInProgress();
      const source = await deps.workouts.get(sourceId);
      if (source === undefined) throw new Error("workout not found");
      const stamp = await hlc.nextFieldStamp();
      const version = await catalogVersion(deps.catalog);
      const log = fitnessWorkoutLogSchema.parse({
        id: deps.idGenerator.newId(),
        status: "in_progress",
        calendarDate: localCalendarDate(deps.now()),
        sessionTemplateId: null,
        scheduledSessionId: null,
        title: source.title,
        startedAt: new Date(deps.now()).toISOString(),
        completedAt: null,
        catalogVersion: version,
        loggedExercises: structuredClone(source.loggedExercises),
        recovery: null,
        deletedAt: null,
        fieldsUpdatedAt: { status: stamp, loggedExercises: stamp, title: stamp },
      }) as FitnessWorkoutLog;
      return deps.workouts.upsert(log);
    },

    async deleteWorkout(id) {
      const current = await deps.workouts.get(id);
      if (current === undefined) return;
      const stamp = await hlc.nextFieldStamp();
      await deps.workouts.upsert({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },

    async applyRemoteWorkouts(rows) {
      for (const row of rows) {
        await deps.workouts.upsert(row, { enqueue: false });
      }
    },
  };
}
