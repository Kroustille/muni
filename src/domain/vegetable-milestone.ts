import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

const timestamp = z.iso.datetime({ offset: true });
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const vegetableMilestoneTypes = ["sow", "transplant", "thin", "harvest"] as const;
export type VegetableMilestoneType = (typeof vegetableMilestoneTypes)[number];

export type VegetableMilestone = {
  id: string;
  cultureId: string;
  milestoneType: VegetableMilestoneType;
  occurredAt: string;
  notes: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const milestoneShape = {
  id: z.uuid(),
  cultureId: z.uuid(),
  milestoneType: z.enum(vegetableMilestoneTypes),
  occurredAt: calendarDate,
  notes: z.string().max(2000).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const vegetableMilestoneSchema = z.strictObject(milestoneShape);

const SNAKE: Partial<Record<keyof VegetableMilestone, string>> = {
  cultureId: "culture_id",
  milestoneType: "milestone_type",
  occurredAt: "occurred_at",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof VegetableMilestone] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const vegetableMilestoneWireSchema = z.strictObject({
  id: milestoneShape.id,
  culture_id: milestoneShape.cultureId,
  milestone_type: milestoneShape.milestoneType,
  occurred_at: milestoneShape.occurredAt,
  notes: milestoneShape.notes,
  deleted_at: milestoneShape.deletedAt,
  fields_updated_at: milestoneShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type VegetableMilestoneWire = z.infer<typeof vegetableMilestoneWireSchema>;

export function vegetableMilestoneToWire(
  milestone: VegetableMilestone,
  serverUpdatedAt: string | null = null,
): VegetableMilestoneWire {
  const { fieldsUpdatedAt, ...rest } = milestone;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<VegetableMilestoneWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToVegetableMilestone(wire: VegetableMilestoneWire): VegetableMilestone {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return vegetableMilestoneSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as VegetableMilestone;
}

const MERGED_MILESTONE_FIELDS = [
  "culture_id",
  "milestone_type",
  "occurred_at",
  "notes",
  "deleted_at",
] as const satisfies readonly (keyof VegetableMilestoneWire)[];

export function mergeVegetableMilestone(
  local: VegetableMilestoneWire,
  remote: VegetableMilestoneWire,
): VegetableMilestoneWire {
  return mergeLwwWire(local, remote, MERGED_MILESTONE_FIELDS);
}

export function milestoneOnDay(
  milestones: readonly VegetableMilestone[],
  cultureId: string,
  milestoneType: VegetableMilestoneType,
  day: string,
): VegetableMilestone | undefined {
  return milestones.find(
    (m) =>
      m.cultureId === cultureId &&
      m.milestoneType === milestoneType &&
      m.occurredAt === day &&
      m.deletedAt === null,
  );
}

export function milestoneRecapSubtitleKey(type: VegetableMilestoneType): string {
  return `plants.milestone.${type}`;
}
