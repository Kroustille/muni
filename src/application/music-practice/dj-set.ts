import type { MusicPracticeDjSetRepository } from "@/application/ports/music-practice-dj-set-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  djSetSchema,
  mergePlannedToPerformed,
  validateDjSet,
  type DjSet,
  type DjSetStatus,
  type SetlistLine,
} from "@/domain/dj-set";
import { localCalendarDate } from "@/domain/music-practice-dates";
import { createMusicPracticeHlc } from "./hlc";

export type DjSetUseCasesDeps = {
  djSets: MusicPracticeDjSetRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type DjSetPatch = Partial<
  Pick<
    DjSet,
    | "title"
    | "status"
    | "performedAt"
    | "venue"
    | "durationMinutes"
    | "genreStyle"
    | "bpmRange"
    | "mood"
    | "notes"
    | "setlist"
    | "externalUrl"
  >
>;

export type DjSetUseCases = {
  listDjSets(): Promise<DjSet[]>;
  getDjSet(id: string): Promise<DjSet | undefined>;
  upsertDjSet(djSet: DjSet): Promise<DjSet>;
  deleteDjSet(id: string): Promise<DjSet>;
  createDjSet(input: { title: string; status?: DjSetStatus }): Promise<DjSet>;
  updateDjSet(id: string, patch: DjSetPatch): Promise<DjSet>;
  markPerformed(id: string, performedAt?: string): Promise<DjSet>;
  cancelDjSet(id: string): Promise<DjSet>;
  restoreDjSet(id: string): Promise<DjSet>;
  transitionPlannedToPerformed(id: string, performedAt?: string): Promise<DjSet>;
};

export function createDjSetUseCases(deps: DjSetUseCasesDeps): DjSetUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  async function save(djSet: DjSet): Promise<DjSet> {
    const err = validateDjSet(djSet, localCalendarDate(deps.now()));
    if (err !== null) throw new Error(err);
    return deps.djSets.upsert(djSetSchema.parse(djSet) as DjSet);
  }

  return {
    listDjSets: () => deps.djSets.list(),
    getDjSet: (id) => deps.djSets.get(id),

    async upsertDjSet(djSet) {
      const err = validateDjSet(djSet, localCalendarDate(deps.now()));
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      const parsed = djSetSchema.parse({
        ...djSet,
        fieldsUpdatedAt: { ...djSet.fieldsUpdatedAt, title: stamp, status: stamp },
      }) as DjSet;
      return deps.djSets.upsert(parsed);
    },

    async createDjSet(input) {
      const stamp = await hlc.nextFieldStamp();
      const status = input.status ?? "planned";
      const today = localCalendarDate(deps.now());
      const performedAt = status === "performed" ? today : null;
      const fieldsUpdatedAt: Record<string, string> = { title: stamp, status: stamp };
      if (performedAt !== null) fieldsUpdatedAt.performedAt = stamp;
      return save({
        id: deps.idGenerator.newId(),
        title: input.title.trim(),
        status,
        performedAt,
        venue: null,
        durationMinutes: null,
        genreStyle: null,
        bpmRange: null,
        mood: null,
        notes: null,
        setlist: [],
        externalUrl: null,
        deletedAt: null,
        fieldsUpdatedAt,
      });
    },

    async updateDjSet(id, patch) {
      const current = await deps.djSets.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("dj set not found");
      const stamp = await hlc.nextFieldStamp();
      const today = localCalendarDate(deps.now());
      const next: DjSet = { ...current, fieldsUpdatedAt: { ...current.fieldsUpdatedAt } };
      const assign = <K extends keyof DjSetPatch>(key: K, value: DjSetPatch[K]) => {
        if (value === undefined) return;
        (next as Record<string, unknown>)[key as string] = value;
        next.fieldsUpdatedAt[key as string] = stamp;
      };
      assign("title", patch.title?.trim());
      assign("venue", patch.venue);
      assign("durationMinutes", patch.durationMinutes);
      assign("genreStyle", patch.genreStyle);
      assign("bpmRange", patch.bpmRange);
      assign("mood", patch.mood);
      assign("notes", patch.notes);
      assign("setlist", patch.setlist as SetlistLine[] | undefined);
      assign("externalUrl", patch.externalUrl);
      if (patch.status !== undefined) {
        next.status = patch.status;
        next.fieldsUpdatedAt.status = stamp;
        if (patch.status === "performed") {
          next.performedAt = patch.performedAt ?? today;
          next.fieldsUpdatedAt.performedAt = stamp;
        } else if (patch.status === "cancelled") {
          next.performedAt = null;
          next.fieldsUpdatedAt.performedAt = stamp;
        } else if (patch.performedAt !== undefined) {
          assign("performedAt", patch.performedAt);
        } else {
          next.performedAt = null;
          next.fieldsUpdatedAt.performedAt = stamp;
        }
      } else if (patch.performedAt !== undefined) {
        assign("performedAt", patch.performedAt);
      }
      return save(next);
    },

    async markPerformed(id, performedAt) {
      const current = await deps.djSets.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("dj set not found");
      const date = performedAt ?? localCalendarDate(deps.now());
      const stamp = await hlc.nextFieldStamp();
      const next = djSetSchema.parse({
        ...current,
        status: "performed",
        performedAt: date,
        fieldsUpdatedAt: {
          ...current.fieldsUpdatedAt,
          status: stamp,
          performedAt: stamp,
        },
      }) as DjSet;
      return save(next);
    },

    async cancelDjSet(id) {
      return this.updateDjSet(id, { status: "cancelled" });
    },

    async transitionPlannedToPerformed(id, performedAt) {
      const current = await deps.djSets.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("dj set not found");
      const date = performedAt ?? localCalendarDate(deps.now());
      const stamp = await hlc.nextFieldStamp();
      const merged = mergePlannedToPerformed(current, { performedAt: date });
      return save({
        ...merged,
        fieldsUpdatedAt: {
          ...current.fieldsUpdatedAt,
          status: stamp,
          performedAt: stamp,
          title: current.fieldsUpdatedAt.title,
        },
      });
    },

    async deleteDjSet(id) {
      const current = await deps.djSets.get(id);
      if (current === undefined) throw new Error("dj set not found");
      const stamp = await hlc.nextFieldStamp();
      const deleted = djSetSchema.parse({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      }) as DjSet;
      return deps.djSets.upsert(deleted);
    },

    async restoreDjSet(id) {
      const current = await deps.djSets.get(id);
      if (current === undefined) throw new Error("dj set not found");
      const stamp = await hlc.nextFieldStamp();
      return save({
        ...current,
        deletedAt: null,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },
  };
}
