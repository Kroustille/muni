import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

import { calendarDate } from "./music-composition";
import { validateDateNotFuture } from "./music-practice-dates";

const timestamp = z.iso.datetime({ offset: true });

export const djSetStatusSchema = z.enum(["planned", "performed", "cancelled"]);
export type DjSetStatus = z.infer<typeof djSetStatusSchema>;

export const setlistLineSchema = z.strictObject({
  sortOrder: z.number(),
  text: z.string().trim().min(1).max(500),
  trackId: z.uuid().optional(),
});

export type SetlistLine = z.infer<typeof setlistLineSchema>;

export type DjSet = {
  id: string;
  title: string;
  status: DjSetStatus;
  /** Eligible for periodic recap (011 FR-006) when status is performed. */
  performedAt: string | null;
  venue: string | null;
  durationMinutes: number | null;
  genreStyle: string | null;
  bpmRange: string | null;
  mood: string | null;
  notes: string | null;
  setlist: SetlistLine[];
  externalUrl: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const djSetShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  status: djSetStatusSchema,
  performedAt: calendarDate.nullable(),
  venue: z.string().trim().max(300).nullable(),
  durationMinutes: z.number().int().min(0).nullable(),
  genreStyle: z.string().trim().max(200).nullable(),
  bpmRange: z.string().trim().max(50).nullable(),
  mood: z.string().trim().max(200).nullable(),
  notes: z.string().max(5000).nullable(),
  setlist: z.array(setlistLineSchema),
  externalUrl: z.string().nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const djSetSchema = z.strictObject(djSetShape);

const SNAKE: Partial<Record<keyof DjSet, string>> = {
  performedAt: "performed_at",
  durationMinutes: "duration_minutes",
  genreStyle: "genre_style",
  bpmRange: "bpm_range",
  externalUrl: "external_url",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof DjSet] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const djSetWireSchema = z.strictObject({
  id: djSetShape.id,
  title: djSetShape.title,
  status: djSetShape.status,
  performed_at: djSetShape.performedAt,
  venue: djSetShape.venue,
  duration_minutes: djSetShape.durationMinutes,
  genre_style: djSetShape.genreStyle,
  bpm_range: djSetShape.bpmRange,
  mood: djSetShape.mood,
  notes: djSetShape.notes,
  setlist: djSetShape.setlist,
  external_url: djSetShape.externalUrl,
  deleted_at: djSetShape.deletedAt,
  fields_updated_at: djSetShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type DjSetWire = z.infer<typeof djSetWireSchema>;

export function djSetToWire(djSet: DjSet, serverUpdatedAt: string | null = null): DjSetWire {
  const { fieldsUpdatedAt, ...rest } = djSet;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<DjSetWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToDjSet(wire: DjSetWire): DjSet {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return djSetSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as DjSet;
}

const MERGED_DJ_SET_FIELDS = [
  "title",
  "status",
  "performed_at",
  "venue",
  "duration_minutes",
  "genre_style",
  "bpm_range",
  "mood",
  "notes",
  "setlist",
  "external_url",
  "deleted_at",
] as const satisfies readonly (keyof DjSetWire)[];

export function mergeDjSet(local: DjSetWire, remote: DjSetWire): DjSetWire {
  return mergeLwwWire(local, remote, MERGED_DJ_SET_FIELDS);
}

export function validateDjSet(djSet: DjSet, today?: string): string | null {
  if (djSet.status === "performed" && djSet.performedAt === null) {
    return "performedAt required when status is performed";
  }
  if (djSet.status !== "performed" && djSet.performedAt !== null) {
    return "performedAt must be null unless status is performed";
  }
  if (djSet.performedAt !== null && today !== undefined) {
    const future = validateDateNotFuture(djSet.performedAt, today);
    if (future !== null) return future;
  }
  return null;
}

/** Transition planned → performed while preserving setlist and metadata (B2). */
export function mergePlannedToPerformed(
  planned: DjSet,
  patch: { performedAt: string; title?: string },
): DjSet {
  return djSetSchema.parse({
    ...planned,
    status: "performed",
    performedAt: patch.performedAt,
    title: patch.title ?? planned.title,
  }) as DjSet;
}
