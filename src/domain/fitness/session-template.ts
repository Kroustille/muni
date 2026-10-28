import { z } from "zod";

import { mergeLwwWire } from "./merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export const templateExerciseSchema = z.strictObject({
  exerciseId: z.string().min(1),
  defaultSetCount: z.number().int().min(0).optional(),
  targetReps: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export type TemplateExercise = z.infer<typeof templateExerciseSchema>;

export type FitnessSessionTemplate = {
  id: string;
  title: string;
  sortOrder: number;
  templateExercises: TemplateExercise[];
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const templateShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  sortOrder: z.number(),
  templateExercises: z.array(templateExerciseSchema),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const fitnessSessionTemplateSchema = z.strictObject(templateShape);

const SNAKE: Partial<Record<keyof FitnessSessionTemplate, string>> = {
  sortOrder: "sort_order",
  templateExercises: "template_exercises",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof FitnessSessionTemplate] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const fitnessSessionTemplateWireSchema = z.strictObject({
  id: templateShape.id,
  title: templateShape.title,
  sort_order: templateShape.sortOrder,
  template_exercises: templateShape.templateExercises,
  deleted_at: templateShape.deletedAt,
  fields_updated_at: templateShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type FitnessSessionTemplateWire = z.infer<typeof fitnessSessionTemplateWireSchema>;

export function fitnessSessionTemplateToWire(
  template: FitnessSessionTemplate,
  serverUpdatedAt: string | null = null,
): FitnessSessionTemplateWire {
  const { fieldsUpdatedAt, ...rest } = template;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<
      FitnessSessionTemplateWire,
      "fields_updated_at" | "server_updated_at"
    >),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToFitnessSessionTemplate(wire: FitnessSessionTemplateWire): FitnessSessionTemplate {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return fitnessSessionTemplateSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as FitnessSessionTemplate;
}

const MERGED_TEMPLATE_FIELDS = [
  "title",
  "sort_order",
  "template_exercises",
  "deleted_at",
] as const satisfies readonly (keyof FitnessSessionTemplateWire)[];

export function mergeFitnessSessionTemplate(
  local: FitnessSessionTemplateWire,
  remote: FitnessSessionTemplateWire,
): FitnessSessionTemplateWire {
  return mergeLwwWire(local, remote, MERGED_TEMPLATE_FIELDS);
}

export function validateSessionTemplate(template: FitnessSessionTemplate): string | null {
  if (template.title.trim().length === 0) return "title required";
  return null;
}
