import type { FitnessProgramRepository } from "@/application/ports/fitness-program-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { FitnessProgram, PlannedSession } from "@/domain/fitness/program";
import { fitnessProgramSchema } from "@/domain/fitness/program";
import { createFitnessHlc } from "./hlc";

export type FitnessProgramUseCasesDeps = {
  programs: FitnessProgramRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type FitnessProgramUseCases = {
  getActiveProgram(): Promise<FitnessProgram | undefined>;
  createProgram(input: { name: string; plannedSessions?: PlannedSession[] }): Promise<FitnessProgram>;
  updateProgram(
    id: string,
    patch: { name?: string; plannedSessions?: PlannedSession[]; isActive?: boolean },
  ): Promise<FitnessProgram>;
};

export function createFitnessProgramUseCases(deps: FitnessProgramUseCasesDeps): FitnessProgramUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);
  return {
    getActiveProgram: () => deps.programs.getActive(),

    async createProgram(input) {
      const stamp = await hlc.nextFieldStamp();
      const existing = await deps.programs.getActive();
      if (existing !== undefined) {
        const deactivated = await this.updateProgram(existing.id, { isActive: false });
        void deactivated;
      }
      const program = fitnessProgramSchema.parse({
        id: deps.idGenerator.newId(),
        name: input.name.trim(),
        isActive: true,
        plannedSessions: input.plannedSessions ?? [],
        deletedAt: null,
        fieldsUpdatedAt: { name: stamp, isActive: stamp, plannedSessions: stamp },
      }) as FitnessProgram;
      return deps.programs.upsert(program);
    },

    async updateProgram(id, patch) {
      const current = await deps.programs.get(id);
      if (current === undefined) throw new Error("program not found");
      const stamp = await hlc.nextFieldStamp();
      const fieldsUpdatedAt = { ...current.fieldsUpdatedAt };
      const next: FitnessProgram = { ...current };
      if (patch.name !== undefined) {
        next.name = patch.name.trim();
        fieldsUpdatedAt.name = stamp;
      }
      if (patch.plannedSessions !== undefined) {
        next.plannedSessions = patch.plannedSessions;
        fieldsUpdatedAt.plannedSessions = stamp;
      }
      if (patch.isActive !== undefined) {
        next.isActive = patch.isActive;
        fieldsUpdatedAt.isActive = stamp;
      }
      next.fieldsUpdatedAt = fieldsUpdatedAt;
      if (patch.isActive === true) {
        const active = await deps.programs.getActive();
        if (active !== undefined && active.id !== id) {
          await deps.programs.upsert({ ...active, isActive: false });
        }
      }
      return deps.programs.upsert(fitnessProgramSchema.parse(next) as FitnessProgram);
    },
  };
}
