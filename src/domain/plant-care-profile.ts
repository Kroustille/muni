import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";
import { plantSeasonalHintSchema, type PlantSeasonalHint } from "@/domain/plant";

const timestamp = z.iso.datetime({ offset: true });

export type PlantCareProfile = {
  id: string;
  title: string;
  seasonalHints: PlantSeasonalHint[];
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const profileShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(300),
  seasonalHints: z.array(plantSeasonalHintSchema),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const plantCareProfileSchema = z.strictObject(profileShape);

const SNAKE: Partial<Record<keyof PlantCareProfile, string>> = {
  seasonalHints: "seasonal_hints",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof PlantCareProfile] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const plantCareProfileWireSchema = z.strictObject({
  id: profileShape.id,
  title: profileShape.title,
  seasonal_hints: profileShape.seasonalHints,
  deleted_at: profileShape.deletedAt,
  fields_updated_at: profileShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PlantCareProfileWire = z.infer<typeof plantCareProfileWireSchema>;

export function plantCareProfileToWire(
  profile: PlantCareProfile,
  serverUpdatedAt: string | null = null,
): PlantCareProfileWire {
  const { fieldsUpdatedAt, ...rest } = profile;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PlantCareProfileWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPlantCareProfile(wire: PlantCareProfileWire): PlantCareProfile {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return plantCareProfileSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as PlantCareProfile;
}

const MERGED_PROFILE_FIELDS = ["title", "seasonal_hints", "deleted_at"] as const satisfies readonly (keyof PlantCareProfileWire)[];

export function mergePlantCareProfile(local: PlantCareProfileWire, remote: PlantCareProfileWire): PlantCareProfileWire {
  return mergeLwwWire(local, remote, MERGED_PROFILE_FIELDS);
}
