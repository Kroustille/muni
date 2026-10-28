import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export const plantLocationTags = ["indoor", "outdoor", "both"] as const;
export type PlantLocationTag = (typeof plantLocationTags)[number];

export const plantSeasonKeys = ["winter", "spring", "summer", "autumn"] as const;
export type PlantSeasonKey = (typeof plantSeasonKeys)[number];

export const plantSeasonalHintSchema = z.strictObject({
  id: z.uuid(),
  seasonKey: z.enum(plantSeasonKeys).nullable(),
  monthRangeText: z.string().trim().max(100).nullable(),
  actionText: z.string().trim().min(1).max(500),
  sortOrder: z.number(),
});

export type PlantSeasonalHint = z.infer<typeof plantSeasonalHintSchema>;

export type Plant = {
  id: string;
  title: string;
  locationTag: PlantLocationTag;
  notes: string | null;
  careProfileId: string | null;
  seasonalHints: PlantSeasonalHint[];
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const plantShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  locationTag: z.enum(plantLocationTags),
  notes: z.string().max(5000).nullable(),
  careProfileId: z.uuid().nullable(),
  seasonalHints: z.array(plantSeasonalHintSchema),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const plantSchema = z.strictObject(plantShape);

const SNAKE: Partial<Record<keyof Plant, string>> = {
  locationTag: "location_tag",
  careProfileId: "care_profile_id",
  seasonalHints: "seasonal_hints",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof Plant] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const plantWireSchema = z.strictObject({
  id: plantShape.id,
  title: plantShape.title,
  location_tag: plantShape.locationTag,
  notes: plantShape.notes,
  care_profile_id: plantShape.careProfileId,
  seasonal_hints: plantShape.seasonalHints,
  deleted_at: plantShape.deletedAt,
  fields_updated_at: plantShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PlantWire = z.infer<typeof plantWireSchema>;

export function plantToWire(plant: Plant, serverUpdatedAt: string | null = null): PlantWire {
  const { fieldsUpdatedAt, ...rest } = plant;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PlantWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPlant(wire: PlantWire): Plant {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return plantSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as Plant;
}

const MERGED_PLANT_FIELDS = [
  "title",
  "location_tag",
  "notes",
  "care_profile_id",
  "seasonal_hints",
  "deleted_at",
] as const satisfies readonly (keyof PlantWire)[];

export function mergePlant(local: PlantWire, remote: PlantWire): PlantWire {
  return mergeLwwWire(local, remote, MERGED_PLANT_FIELDS);
}

export function validatePlantTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length < 1 || trimmed.length > 500) return "title length 1-500";
  return null;
}

export function validateSeasonalHint(hint: PlantSeasonalHint): string | null {
  const parsed = plantSeasonalHintSchema.safeParse(hint);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "invalid hint";
  if (hint.seasonKey === null && (hint.monthRangeText === null || hint.monthRangeText.trim() === "")) {
    return "season or month range required";
  }
  return null;
}
