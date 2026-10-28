import type { MusicPracticeCompositionRepository } from "@/application/ports/music-practice-composition-repository";
import type { MetaStore } from "@/application/ports/item-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import {
  musicCompositionSchema,
  sortSessionNotesChronologically,
  validateMusicComposition,
  type MusicComposition,
  type MusicCompositionStatus,
  type SessionNote,
} from "@/domain/music-composition";
import { localCalendarDate } from "@/domain/music-practice-dates";
import { createMusicPracticeHlc } from "./hlc";

export type MusicCompositionUseCasesDeps = {
  compositions: MusicPracticeCompositionRepository;
  meta: MetaStore;
  idGenerator: IdGenerator;
  now: () => number;
};

export type CompositionPatch = Partial<
  Pick<
    MusicComposition,
    | "title"
    | "status"
    | "startedAt"
    | "finishedAt"
    | "lastWorkedAt"
    | "genreStyle"
    | "tempoBpm"
    | "mood"
    | "notes"
    | "externalUrl"
    | "linkedTrackIds"
  >
>;

export type MusicCompositionUseCases = {
  listCompositions(): Promise<MusicComposition[]>;
  getComposition(id: string): Promise<MusicComposition | undefined>;
  upsertComposition(composition: MusicComposition): Promise<MusicComposition>;
  deleteComposition(id: string): Promise<MusicComposition>;
  createComposition(input: { title: string; status?: MusicCompositionStatus }): Promise<MusicComposition>;
  updateComposition(id: string, patch: CompositionPatch): Promise<MusicComposition>;
  appendSessionNote(id: string, input: { date?: string; text: string }): Promise<MusicComposition>;
  restoreComposition(id: string): Promise<MusicComposition>;
};

export function createMusicCompositionUseCases(
  deps: MusicCompositionUseCasesDeps,
): MusicCompositionUseCases {
  const hlc = createMusicPracticeHlc(deps.meta, deps.idGenerator, deps.now);

  async function save(composition: MusicComposition): Promise<MusicComposition> {
    const today = localCalendarDate(deps.now());
    const err = validateMusicComposition(composition, today);
    if (err !== null) throw new Error(err);
    return deps.compositions.upsert(musicCompositionSchema.parse(composition) as MusicComposition);
  }

  return {
    listCompositions: () => deps.compositions.list(),
    getComposition: (id) => deps.compositions.get(id),

    async upsertComposition(composition) {
      const today = localCalendarDate(deps.now());
      const err = validateMusicComposition(composition, today);
      if (err !== null) throw new Error(err);
      const stamp = await hlc.nextFieldStamp();
      const parsed = musicCompositionSchema.parse({
        ...composition,
        fieldsUpdatedAt: { ...composition.fieldsUpdatedAt, title: stamp, status: stamp },
      }) as MusicComposition;
      return deps.compositions.upsert(parsed);
    },

    async createComposition(input) {
      const stamp = await hlc.nextFieldStamp();
      const status = input.status ?? "idea";
      const today = localCalendarDate(deps.now());
      const finishedAt = status === "finished" ? today : null;
      const fieldsUpdatedAt: Record<string, string> = { title: stamp, status: stamp };
      if (finishedAt !== null) fieldsUpdatedAt.finishedAt = stamp;
      return save({
        id: deps.idGenerator.newId(),
        title: input.title.trim(),
        status,
        startedAt: null,
        finishedAt,
        lastWorkedAt: null,
        genreStyle: null,
        tempoBpm: null,
        mood: null,
        notes: null,
        externalUrl: null,
        sessionNotes: [],
        linkedTrackIds: null,
        deletedAt: null,
        fieldsUpdatedAt,
      });
    },

    async updateComposition(id, patch) {
      const current = await deps.compositions.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("composition not found");
      const stamp = await hlc.nextFieldStamp();
      const today = localCalendarDate(deps.now());
      const next: MusicComposition = { ...current, fieldsUpdatedAt: { ...current.fieldsUpdatedAt } };
      const assign = <K extends keyof CompositionPatch>(key: K, value: CompositionPatch[K]) => {
        if (value === undefined) return;
        (next as Record<string, unknown>)[key as string] = value;
        next.fieldsUpdatedAt[key as string] = stamp;
      };
      assign("title", patch.title?.trim());
      assign("startedAt", patch.startedAt);
      assign("lastWorkedAt", patch.lastWorkedAt);
      assign("genreStyle", patch.genreStyle);
      assign("tempoBpm", patch.tempoBpm);
      assign("mood", patch.mood);
      assign("notes", patch.notes);
      assign("externalUrl", patch.externalUrl);
      assign("linkedTrackIds", patch.linkedTrackIds);
      if (patch.status !== undefined) {
        next.status = patch.status;
        next.fieldsUpdatedAt.status = stamp;
        if (patch.status === "finished") {
          next.finishedAt = patch.finishedAt ?? today;
          next.fieldsUpdatedAt.finishedAt = stamp;
        } else if (patch.finishedAt !== undefined) {
          assign("finishedAt", patch.finishedAt);
        } else {
          next.finishedAt = null;
          next.fieldsUpdatedAt.finishedAt = stamp;
        }
      } else if (patch.finishedAt !== undefined) {
        assign("finishedAt", patch.finishedAt);
      }
      return save(next);
    },

    async appendSessionNote(id, input) {
      const current = await deps.compositions.get(id);
      if (current === undefined || current.deletedAt !== null) throw new Error("composition not found");
      const stamp = await hlc.nextFieldStamp();
      const date = input.date ?? localCalendarDate(deps.now());
      const note: SessionNote = { date, text: input.text.trim() };
      const sessionNotes = sortSessionNotesChronologically([...current.sessionNotes, note]);
      return save({
        ...current,
        sessionNotes,
        lastWorkedAt: date,
        fieldsUpdatedAt: {
          ...current.fieldsUpdatedAt,
          sessionNotes: stamp,
          lastWorkedAt: stamp,
        },
      });
    },

    async deleteComposition(id) {
      const current = await deps.compositions.get(id);
      if (current === undefined) throw new Error("composition not found");
      const stamp = await hlc.nextFieldStamp();
      const deleted = musicCompositionSchema.parse({
        ...current,
        deletedAt: new Date(deps.now()).toISOString(),
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      }) as MusicComposition;
      return deps.compositions.upsert(deleted);
    },

    async restoreComposition(id) {
      const current = await deps.compositions.get(id);
      if (current === undefined) throw new Error("composition not found");
      const stamp = await hlc.nextFieldStamp();
      return save({
        ...current,
        deletedAt: null,
        fieldsUpdatedAt: { ...current.fieldsUpdatedAt, deletedAt: stamp },
      });
    },
  };
}
