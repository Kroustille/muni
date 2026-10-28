import type { FitnessSessionTemplateRepository } from "@/application/ports/fitness-session-template-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  fitnessSessionTemplateSchema,
  type FitnessSessionTemplate,
  type TemplateExercise,
} from "@/domain/fitness/session-template";
import { createFitnessHlc } from "./hlc";

export type FitnessSessionTemplateUseCasesDeps = {
  templates: FitnessSessionTemplateRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type FitnessSessionTemplateUseCases = {
  listTemplates(): Promise<FitnessSessionTemplate[]>;
  getTemplate(id: string): Promise<FitnessSessionTemplate | undefined>;
  createTemplate(input: { title: string; templateExercises?: TemplateExercise[] }): Promise<FitnessSessionTemplate>;
  updateTemplate(
    id: string,
    patch: { title?: string; templateExercises?: TemplateExercise[]; sortOrder?: number },
  ): Promise<FitnessSessionTemplate>;
  deleteTemplate(id: string): Promise<void>;
};

export function createFitnessSessionTemplateUseCases(
  deps: FitnessSessionTemplateUseCasesDeps,
): FitnessSessionTemplateUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);
  return {
    listTemplates: () => deps.templates.list(),

    getTemplate: (id) => deps.templates.get(id),

    async createTemplate(input) {
      const stamp = await hlc.nextFieldStamp();
      const existing = await deps.templates.list();
      const template = fitnessSessionTemplateSchema.parse({
        id: deps.idGenerator.newId(),
        title: input.title.trim(),
        sortOrder: existing.length,
        templateExercises: input.templateExercises ?? [],
        deletedAt: null,
        fieldsUpdatedAt: { title: stamp, templateExercises: stamp, sortOrder: stamp },
      }) as FitnessSessionTemplate;
      return deps.templates.upsert(template);
    },

    async updateTemplate(id, patch) {
      const current = await deps.templates.get(id);
      if (current === undefined) throw new Error("template not found");
      const stamp = await hlc.nextFieldStamp();
      const fieldsUpdatedAt = { ...current.fieldsUpdatedAt };
      const next: FitnessSessionTemplate = { ...current };
      if (patch.title !== undefined) {
        next.title = patch.title.trim();
        fieldsUpdatedAt.title = stamp;
      }
      if (patch.templateExercises !== undefined) {
        next.templateExercises = patch.templateExercises;
        fieldsUpdatedAt.templateExercises = stamp;
      }
      if (patch.sortOrder !== undefined) {
        next.sortOrder = patch.sortOrder;
        fieldsUpdatedAt.sortOrder = stamp;
      }
      next.fieldsUpdatedAt = fieldsUpdatedAt;
      return deps.templates.upsert(fitnessSessionTemplateSchema.parse(next) as FitnessSessionTemplate);
    },

    async deleteTemplate(id) {
      const current = await deps.templates.get(id);
      if (current === undefined) return;
      const stamp = await hlc.nextFieldStamp();
      await deps.templates.upsert({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },
  };
}
