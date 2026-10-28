import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

import { calendarDate } from "./music-composition";

const timestamp = z.iso.datetime({ offset: true });

export const planAssignmentSchema = z.strictObject({
  id: z.uuid(),
  exerciseId: z.uuid(),
  weekdays: z.array(z.number().int().min(1).max(7)).nullable(),
  specificDates: z.array(calendarDate).nullable(),
  sortOrder: z.number(),
});

export type PlanAssignment = z.infer<typeof planAssignmentSchema>;

export type PracticePlan = {
  id: string;
  name: string;
  isActive: boolean;
  assignments: PlanAssignment[];
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const planShape = {
  id: z.uuid(),
  name: z.string().trim().min(1).max(300),
  isActive: z.boolean(),
  assignments: z.array(planAssignmentSchema),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const practicePlanSchema = z.strictObject(planShape);

const SNAKE: Partial<Record<keyof PracticePlan, string>> = {
  isActive: "is_active",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof PracticePlan] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const practicePlanWireSchema = z.strictObject({
  id: planShape.id,
  name: planShape.name,
  is_active: planShape.isActive,
  assignments: planShape.assignments,
  deleted_at: planShape.deletedAt,
  fields_updated_at: planShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PracticePlanWire = z.infer<typeof practicePlanWireSchema>;

export function practicePlanToWire(
  plan: PracticePlan,
  serverUpdatedAt: string | null = null,
): PracticePlanWire {
  const { fieldsUpdatedAt, ...rest } = plan;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PracticePlanWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPracticePlan(wire: PracticePlanWire): PracticePlan {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return practicePlanSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as PracticePlan;
}

const MERGED_FIELDS = ["name", "is_active", "assignments", "deleted_at"] as const satisfies readonly (keyof PracticePlanWire)[];

export function mergePracticePlan(local: PracticePlanWire, remote: PracticePlanWire): PracticePlanWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

export function validatePlanAssignment(assignment: PlanAssignment): string | null {
  const weekdays = assignment.weekdays ?? [];
  const dates = assignment.specificDates ?? [];
  if (weekdays.length === 0 && dates.length === 0) {
    return "assignment requires weekdays or specificDates";
  }
  return null;
}

export function validatePracticePlan(plan: PracticePlan): string | null {
  for (const assignment of plan.assignments) {
    const err = validatePlanAssignment(assignment);
    if (err !== null) return err;
  }
  return null;
}
