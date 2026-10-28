import type { MusicPracticeInstrumentRepository } from "@/application/ports/music-practice-instrument-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  practiceInstrumentSchema,
  validatePracticeInstrument,
  type PracticeInstrument,
} from "@/domain/practice-instrument";
import { createMusicPracticeHlc } from "./hlc";

export type PracticeInstrumentUseCasesDeps = {
  instruments: MusicPracticeInstrumentRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type PracticeInstrumentUseCases = {
  listInstruments(): Promise<PracticeInstrument[]>;
  getInstrument(id: string): Promise<PracticeInstrument | undefined>;
  upsertInstrument(instrument: PracticeInstrument): Promise<PracticeInstrument>;
  deleteInstrument(id: string): Promise<PracticeInstrument>;
  createQuick(input: { name: string }): Promise<PracticeInstrument>;
  restoreInstrument(id: string): Promise<PracticeInstrument>;
};

export function createPracticeInstrumentUseCases(
  deps: PracticeInstrumentUseCasesDeps,
): PracticeInstrumentUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  return {
    listInstruments: () => deps.instruments.list(),
    getInstrument: (id) => deps.instruments.get(id),

    async createQuick(input) {
      const stamp = await hlc.nextFieldStamp();
      const instrument = practiceInstrumentSchema.parse({
        id: deps.idGenerator.newId(),
        name: input.name.trim(),
        notes: null,
        deletedAt: null,
        fieldsUpdatedAt: { name: stamp },
      }) as PracticeInstrument;
      const err = validatePracticeInstrument(instrument);
      if (err !== null) throw new Error(err);
      return deps.instruments.upsert(instrument);
    },

    async upsertInstrument(instrument) {
      const err = validatePracticeInstrument(instrument);
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      return deps.instruments.upsert(
        practiceInstrumentSchema.parse({
          ...instrument,
          fieldsUpdatedAt: { ...instrument.fieldsUpdatedAt, name: stamp },
        }) as PracticeInstrument,
      );
    },

    async deleteInstrument(id) {
      const current = await deps.instruments.get(id);
      if (current === undefined) throw new Error("instrument not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.instruments.upsert(
        practiceInstrumentSchema.parse({
          ...current,
          deletedAt: new Date(deps.now()).toISOString(),
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as PracticeInstrument,
      );
    },

    async restoreInstrument(id) {
      const current = await deps.instruments.get(id);
      if (current === undefined) throw new Error("instrument not found");
      const stamp = await hlc.nextFieldStamp();
      return deps.instruments.upsert(
        practiceInstrumentSchema.parse({
          ...current,
          deletedAt: null,
          fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
        }) as PracticeInstrument,
      );
    },
  };
}
