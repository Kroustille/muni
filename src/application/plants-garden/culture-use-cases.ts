import type { PlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import type { PlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import { createFitnessHlc } from "@/application/fitness/hlc";
import { localCalendarDate } from "@/application/fitness/today";
import { validateOccurredAtNotFuture } from "@/domain/plant-care-event";
import {
  milestoneOnDay,
  vegetableMilestoneSchema,
  type VegetableMilestone,
  type VegetableMilestoneType,
} from "@/domain/vegetable-milestone";
import { vegetableCultureSchema, type VegetableCulture } from "@/domain/vegetable-culture";

export type CultureUseCasesDeps = {
  cultures: PlantsGardenCultureRepository;
  milestones: PlantsGardenMilestoneRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type CultureUseCases = {
  listCultures(): Promise<VegetableCulture[]>;
  getCulture(id: string): Promise<VegetableCulture | undefined>;
  createCulture(input: { title: string }): Promise<VegetableCulture>;
  updateCulture(
    id: string,
    patch: Partial<Pick<VegetableCulture, "title" | "locationNote" | "variety" | "notes">>,
  ): Promise<VegetableCulture>;
  softDeleteCulture(id: string): Promise<VegetableCulture>;
  recordMilestone(input: {
    cultureId: string;
    milestoneType: VegetableMilestoneType;
    occurredAt: string;
    notes?: string | null;
  }): Promise<{ kind: "created" | "deduped"; milestone: VegetableMilestone }>;
  listMilestones(cultureId: string): Promise<VegetableMilestone[]>;
};

export function createCultureUseCases(deps: CultureUseCasesDeps): CultureUseCases {
  const hlc = createFitnessHlc(deps.meta, deps.idGenerator, deps.now);

  return {
    listCultures: () => deps.cultures.list(),
    getCulture: (id) => deps.cultures.get(id),

    async createCulture(input) {
      const title = input.title.trim();
      if (title.length < 1 || title.length > 500) throw new Error("title length 1-500");
      const stamp = await hlc.nextFieldStamp();
      const culture = vegetableCultureSchema.parse({
        id: deps.idGenerator.newId(),
        title,
        locationNote: null,
        variety: null,
        notes: null,
        plantId: null,
        deletedAt: null,
        fieldsUpdatedAt: {
          title: stamp,
          locationNote: stamp,
          variety: stamp,
          notes: stamp,
          plantId: stamp,
        },
      }) as VegetableCulture;
      return deps.cultures.upsert(culture);
    },

    async updateCulture(id, patch) {
      const current = await deps.cultures.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("culture not found");
      const stamp = await hlc.nextFieldStamp();
      const fieldsUpdatedAt = { ...current.fieldsUpdatedAt };
      const next: VegetableCulture = { ...current };
      if (patch.title !== undefined) {
        next.title = patch.title;
        fieldsUpdatedAt.title = stamp;
      }
      if (patch.locationNote !== undefined) {
        next.locationNote = patch.locationNote;
        fieldsUpdatedAt.locationNote = stamp;
      }
      if (patch.variety !== undefined) {
        next.variety = patch.variety;
        fieldsUpdatedAt.variety = stamp;
      }
      if (patch.notes !== undefined) {
        next.notes = patch.notes;
        fieldsUpdatedAt.notes = stamp;
      }
      next.fieldsUpdatedAt = fieldsUpdatedAt;
      return deps.cultures.upsert(vegetableCultureSchema.parse(next) as VegetableCulture);
    },

    async softDeleteCulture(id) {
      const current = await deps.cultures.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("culture not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.cultures.upsert({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },

    async recordMilestone(input) {
      const culture = await deps.cultures.get(input.cultureId);
      if (culture === undefined || culture.deletedAt !== null) throw new Error("culture not found");
      const today = localCalendarDate(deps.now());
      const dateErr = validateOccurredAtNotFuture(input.occurredAt, today);
      if (dateErr !== null) throw new Error(dateErr);
      const existing = await deps.milestones.listByCulture(input.cultureId);
      const dup = milestoneOnDay(existing, input.cultureId, input.milestoneType, input.occurredAt);
      if (dup !== undefined) return { kind: "deduped", milestone: dup };
      const stamp = await hlc.nextFieldStamp();
      const milestone = vegetableMilestoneSchema.parse({
        id: deps.idGenerator.newId(),
        cultureId: input.cultureId,
        milestoneType: input.milestoneType,
        occurredAt: input.occurredAt,
        notes: input.notes ?? null,
        deletedAt: null,
        fieldsUpdatedAt: {
          cultureId: stamp,
          milestoneType: stamp,
          occurredAt: stamp,
          notes: stamp,
        },
      }) as VegetableMilestone;
      const saved = await deps.milestones.upsert(milestone);
      return { kind: "created", milestone: saved };
    },

    listMilestones: (cultureId) => deps.milestones.listByCulture(cultureId),
  };
}
