import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";
import { BOOK_MOODS } from "@/domain/item-book";
import {
  calendarDateSchema,
  createSnakeCodec,
  isAfterDay,
  MAX_LINKS,
  souvenirLinkSchema,
  timestampSchema,
  validateTitle,
} from "@/domain/memories-growth-shared";

export { type SouvenirLink } from "@/domain/memories-growth-shared";

/** A remembered good moment (015 US1). Typed: date, mood, place, links — text is optional. */
export const souvenirSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  occurredOn: calendarDateSchema,
  body: z.string().nullable(),
  mood: z.enum(BOOK_MOODS).nullable(),
  place: z.string().nullable(),
  favourite: z.boolean(),
  links: z.array(souvenirLinkSchema),
  createdAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
});

export type Souvenir = z.infer<typeof souvenirSchema>;

export const souvenirWireSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  occurred_on: calendarDateSchema,
  body: z.string().max(10_000).nullable(),
  mood: z.enum(BOOK_MOODS).nullable(),
  place: z.string().max(200).nullable(),
  favourite: z.boolean(),
  links: z.array(souvenirLinkSchema).max(MAX_LINKS),
  created_at: timestampSchema,
  deleted_at: timestampSchema.nullable(),
  fields_updated_at: z.record(z.string(), z.string()),
  server_updated_at: timestampSchema.nullable().optional(),
});

export type SouvenirWire = z.infer<typeof souvenirWireSchema>;

const codec = createSnakeCodec({
  occurredOn: "occurred_on",
  createdAt: "created_at",
  deletedAt: "deleted_at",
});

export function souvenirToWire(
  souvenir: Souvenir,
  serverUpdatedAt: string | null = null,
): SouvenirWire {
  return codec.toWire(souvenir, serverUpdatedAt) as SouvenirWire;
}

export function wireToSouvenir(wire: SouvenirWire): Souvenir {
  return souvenirSchema.parse(codec.fromWire(wire));
}

const MERGED_FIELDS = [
  "title",
  "occurred_on",
  "body",
  "mood",
  "place",
  "favourite",
  "links",
  "deleted_at",
] as const satisfies readonly (keyof SouvenirWire)[];

export function mergeSouvenir(local: SouvenirWire, remote: SouvenirWire): SouvenirWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

/** Returns an error message, or null when valid. `today` is the user's calendar day. */
export function validateSouvenir(souvenir: Souvenir, today: string): string | null {
  const titleError = validateTitle(souvenir.title, 200);
  if (titleError) return titleError;
  if (isAfterDay(souvenir.occurredOn, today)) return "occurredOn must not be in the future";
  if (souvenir.body !== null && souvenir.body.length > 10_000) return "body too long";
  if (souvenir.place !== null && souvenir.place.length > 200) return "place too long";
  if (souvenir.links.length > MAX_LINKS) return `links max ${MAX_LINKS}`;
  return null;
}
