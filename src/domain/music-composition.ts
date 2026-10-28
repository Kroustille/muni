import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

import { validateDateNotFuture } from "./music-practice-dates";

const timestamp = z.iso.datetime({ offset: true });
export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const musicCompositionStatusSchema = z.enum([
  "idea",
  "in_progress",
  "paused",
  "finished",
  "archived",
]);
export type MusicCompositionStatus = z.infer<typeof musicCompositionStatusSchema>;

export const sessionNoteSchema = z.strictObject({
  date: calendarDate,
  text: z.string().max(2000),
});

export type SessionNote = z.infer<typeof sessionNoteSchema>;

export type MusicComposition = {
  id: string;
  title: string;
  status: MusicCompositionStatus;
  startedAt: string | null;
  /** Eligible for periodic recap (011 FR-006) when status is finished. */
  finishedAt: string | null;
  lastWorkedAt: string | null;
  genreStyle: string | null;
  tempoBpm: number | null;
  mood: string | null;
  notes: string | null;
  externalUrl: string | null;
  sessionNotes: SessionNote[];
  linkedTrackIds: string[] | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const compositionShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  status: musicCompositionStatusSchema,
  startedAt: calendarDate.nullable(),
  finishedAt: calendarDate.nullable(),
  lastWorkedAt: calendarDate.nullable(),
  genreStyle: z.string().trim().max(200).nullable(),
  tempoBpm: z.number().int().min(20).max(400).nullable(),
  mood: z.string().trim().max(200).nullable(),
  notes: z.string().max(5000).nullable(),
  externalUrl: z.string().nullable(),
  sessionNotes: z.array(sessionNoteSchema),
  linkedTrackIds: z.array(z.uuid()).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const musicCompositionSchema = z.strictObject(compositionShape);

const SNAKE: Partial<Record<keyof MusicComposition, string>> = {
  startedAt: "started_at",
  finishedAt: "finished_at",
  lastWorkedAt: "last_worked_at",
  genreStyle: "genre_style",
  tempoBpm: "tempo_bpm",
  sessionNotes: "session_notes",
  linkedTrackIds: "linked_track_ids",
  externalUrl: "external_url",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof MusicComposition] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const musicCompositionWireSchema = z.strictObject({
  id: compositionShape.id,
  title: compositionShape.title,
  status: compositionShape.status,
  started_at: compositionShape.startedAt,
  finished_at: compositionShape.finishedAt,
  last_worked_at: compositionShape.lastWorkedAt,
  genre_style: compositionShape.genreStyle,
  tempo_bpm: compositionShape.tempoBpm,
  mood: compositionShape.mood,
  notes: compositionShape.notes,
  external_url: compositionShape.externalUrl,
  session_notes: compositionShape.sessionNotes,
  linked_track_ids: compositionShape.linkedTrackIds,
  deleted_at: compositionShape.deletedAt,
  fields_updated_at: compositionShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type MusicCompositionWire = z.infer<typeof musicCompositionWireSchema>;

export function musicCompositionToWire(
  composition: MusicComposition,
  serverUpdatedAt: string | null = null,
): MusicCompositionWire {
  const { fieldsUpdatedAt, ...rest } = composition;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<MusicCompositionWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToMusicComposition(wire: MusicCompositionWire): MusicComposition {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return musicCompositionSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as MusicComposition;
}

const MERGED_COMPOSITION_FIELDS = [
  "title",
  "status",
  "started_at",
  "finished_at",
  "last_worked_at",
  "genre_style",
  "tempo_bpm",
  "mood",
  "notes",
  "external_url",
  "session_notes",
  "linked_track_ids",
  "deleted_at",
] as const satisfies readonly (keyof MusicCompositionWire)[];

export function mergeMusicComposition(
  local: MusicCompositionWire,
  remote: MusicCompositionWire,
): MusicCompositionWire {
  return mergeLwwWire(local, remote, MERGED_COMPOSITION_FIELDS);
}

export function sortSessionNotesChronologically(notes: SessionNote[]): SessionNote[] {
  return [...notes].sort((a, b) => a.date.localeCompare(b.date));
}

export function validateMusicComposition(
  composition: MusicComposition,
  today?: string,
): string | null {
  if (composition.status === "finished" && composition.finishedAt === null) {
    return "finishedAt required when status is finished";
  }
  if (composition.status !== "finished" && composition.finishedAt !== null) {
    return "finishedAt must be null unless status is finished";
  }
  if (composition.finishedAt !== null && today !== undefined) {
    const future = validateDateNotFuture(composition.finishedAt, today);
    if (future !== null) return future;
  }
  if (composition.startedAt !== null && today !== undefined) {
    const future = validateDateNotFuture(composition.startedAt, today);
    if (future !== null) return future;
  }
  if (composition.lastWorkedAt !== null && today !== undefined) {
    const future = validateDateNotFuture(composition.lastWorkedAt, today);
    if (future !== null) return future;
  }
  return null;
}
