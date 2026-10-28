import type { MusicPracticePlanRepository } from "@/application/ports/music-practice-plan-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  practicePlanSchema,
  validatePracticePlan,
  type PracticePlan,
} from "@/domain/practice-plan";
import { createMusicPracticeHlc } from "./hlc";

export type PracticePlanUseCasesDeps = {
  plans: MusicPracticePlanRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type PracticePlanUseCases = {
  getActivePlan(): Promise<PracticePlan | undefined>;
  listPlans(): Promise<PracticePlan[]>;
  upsertPlan(plan: PracticePlan): Promise<PracticePlan>;
  deletePlan(id: string): Promise<PracticePlan>;
  createPlan(input: { name: string; isActive?: boolean }): Promise<PracticePlan>;
  restorePlan(id: string): Promise<PracticePlan>;
};

export function createPracticePlanUseCases(deps: PracticePlanUseCasesDeps): PracticePlanUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  return {
    getActivePlan: () => deps.plans.getActive(),
    listPlans: () => deps.plans.list(),

    async createPlan(input) {
      const stamp = await hlc.nextFieldStamp();
      const isActive = input.isActive ?? true;
      if (isActive) {
        const active = await deps.plans.getActive();
        if (active !== undefined) {
          await deps.plans.upsert({ ...active, isActive: false });
        }
      }
      const plan = practicePlanSchema.parse({
        id: deps.idGenerator.newId(),
        name: input.name.trim(),
        isActive,
        assignments: [],
        deletedAt: null,
        fieldsUpdatedAt: { name: stamp, isActive: stamp, assignments: stamp },
      }) as PracticePlan;
      const err = validatePracticePlan(plan);
      if (err !== null) throw new Error(err);
      return deps.plans.upsert(plan);
    },

    async upsertPlan(plan) {
      const err = validatePracticePlan(plan);
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      const next = practicePlanSchema.parse({
        ...plan,
        fieldsUpdatedAt: { ...plan.fieldsUpdatedAt, name: stamp, assignments: stamp },
      }) as PracticePlan;
      if (next.isActive) {
        const active = await deps.plans.getActive();
        if (active !== undefined && active.id !== next.id) {
          await deps.plans.upsert({ ...active, isActive: false });
        }
      }
      return deps.plans.upsert(next);
    },

    async deletePlan(id) {
      const current = await deps.plans.get(id);
      if (current === undefined) throw new Error("plan not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.plans.upsert(
        practicePlanSchema.parse({
          ...current,
          deletedAt: new Date(deps.now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as PracticePlan,
      );
    },

    async restorePlan(id) {
      const current = await deps.plans.get(id);
      if (current === undefined) throw new Error("plan not found");
      const stamp = await hlc.nextFieldStamp();
      const restored = practicePlanSchema.parse({
        ...current,
        deletedAt: null,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      }) as PracticePlan;
      const err = validatePracticePlan(restored);
      if (err !== null) throw new Error(err);
      return deps.plans.upsert(restored);
    },
  };
}
