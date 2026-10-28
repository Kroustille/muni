import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export type VegetableCulture = {
  id: string;
  title: string;
  locationNote: string | null;
  variety: string | null;
  notes: string | null;
  plantId: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const cultureShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  locationNote: z.string().max(300).nullable(),
  variety: z.string().max(200).nullable(),
  notes: z.string().max(5000).nullable(),
  plantId: z.uuid().nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const vegetableCultureSchema = z.strictObject(cultureShape);

const SNAKE: Partial<Record<keyof VegetableCulture, string>> = {
  locationNote: "location_note",
  plantId: "plant_id",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof VegetableCulture] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const vegetableCultureWireSchema = z.strictObject({
  id: cultureShape.id,
  title: cultureShape.title,
  location_note: cultureShape.locationNote,
  variety: cultureShape.variety,
  notes: cultureShape.notes,
  plant_id: cultureShape.plantId,
  deleted_at: cultureShape.deletedAt,
  fields_updated_at: cultureShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type VegetableCultureWire = z.infer<typeof vegetableCultureWireSchema>;

export function vegetableCultureToWire(
  culture: VegetableCulture,
  serverUpdatedAt: string | null = null,
): VegetableCultureWire {
  const { fieldsUpdatedAt, ...rest } = culture;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<VegetableCultureWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToVegetableCulture(wire: VegetableCultureWire): VegetableCulture {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return vegetableCultureSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as VegetableCulture;
}

const MERGED_CULTURE_FIELDS = [
  "title",
  "location_note",
  "variety",
  "notes",
  "plant_id",
  "deleted_at",
] as const satisfies readonly (keyof VegetableCultureWire)[];

export function mergeVegetableCulture(local: VegetableCultureWire, remote: VegetableCultureWire): VegetableCultureWire {
  return mergeLwwWire(local, remote, MERGED_CULTURE_FIELDS);
}
