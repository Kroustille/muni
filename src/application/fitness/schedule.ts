import type { FitnessScheduledSessionRepository } from "@/application/ports/fitness-scheduled-session-repository";
import type { FitnessSessionTemplateRepository } from "@/application/ports/fitness-session-template-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  fitnessScheduledSessionSchema,
  type FitnessScheduledSession,
} from "@/domain/fitness/scheduled-session";
import { createFitnessHlc } from "./hlc";

export type FitnessScheduleUseCasesDeps = {
  scheduled: FitnessScheduledSessionRepository;
  templates: FitnessSessionTemplateRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type FitnessScheduleUseCases = {
  listScheduled(): Promise<FitnessScheduledSession[]>;
  listScheduledForDate(calendarDate: string): Promise<FitnessScheduledSession[]>;
  planifier(input: {
    sessionTemplateId: string;
    calendarDate: string;
  }): Promise<FitnessScheduledSession>;
  unplanifier(id: string): Promise<void>;
};

export function createFitnessScheduleUseCases(
  deps: FitnessScheduleUseCasesDeps,
): FitnessScheduleUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);
  return {
    listScheduled: () => deps.scheduled.list(),

    listScheduledForDate: (calendarDate) => deps.scheduled.listForDate(calendarDate),

    async planifier(input) {
      const template = await deps.templates.get(input.sessionTemplateId);
      if (template === undefined || template.deletedAt !== null) {
        throw new Error("template not found");
      }
      const stamp = await hlc.nextFieldStamp();
      const sameDay = await deps.scheduled.listForDate(input.calendarDate);
      const row = fitnessScheduledSessionSchema.parse({
        id: deps.idGenerator.newId(),
        calendarDate: input.calendarDate,
        sessionTemplateId: input.sessionTemplateId,
        sortOrder: sameDay.length,
        titleSnapshot: null,
        templateExercisesSnapshot: null,
        deletedAt: null,
        fieldsUpdatedAt: { calendarDate: stamp, sessionTemplateId: stamp, sortOrder: stamp },
      }) as FitnessScheduledSession;
      return deps.scheduled.upsert(row);
    },

    async unplanifier(id) {
      const current = await deps.scheduled.get(id);
      if (current === undefined) return;
      const stamp = await hlc.nextFieldStamp();
      await deps.scheduled.upsert({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },
  };
}
