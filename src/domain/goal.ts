import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";
import {
  calendarDateSchema,
  createSnakeCodec,
  isAfterDay,
  timestampSchema,
  validateTitle,
} from "@/domain/memories-growth-shared";

/** Personal goals (objectifs) and their manual check-ins (015 US3). */

export const goalPeriodKinds = ["week", "month", "quarter", "year", "custom"] as const;
export type GoalPeriodKind = (typeof goalPeriodKinds)[number];

export const goalTargetKinds = ["domain_count", "checkin_count", "done"] as const;
export type GoalTargetKind = (typeof goalTargetKinds)[number];

/** Measurable signals — récap domains (011) plus souvenirs. See research R5. */
export const goalMetrics = [
  "books",
  "movies",
  "recipes",
  "fitness",
  "music_practice",
  "plants",
  "souvenirs",
] as const;
export type GoalMetric = (typeof goalMetrics)[number];

export const goalStatuses = ["active", "archived"] as const;
export type GoalStatus = (typeof goalStatuses)[number];

export const goalSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  periodKind: z.enum(goalPeriodKinds),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema,
  targetKind: z.enum(goalTargetKinds),
  metric: z.enum(goalMetrics).nullable(),
  targetCount: z.number().int().nullable(),
  status: z.enum(goalStatuses),
  reflection: z.string().nullable(),
  reflectionPromptDismissedAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
});
export type Goal = z.infer<typeof goalSchema>;

export const goalWireSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  period_kind: z.enum(goalPeriodKinds),
  start_date: calendarDateSchema,
  end_date: calendarDateSchema,
  target_kind: z.enum(goalTargetKinds),
  metric: z.enum(goalMetrics).nullable(),
  target_count: z.number().int().min(1).nullable(),
  status: z.enum(goalStatuses),
  reflection: z.string().max(5_000).nullable(),
  reflection_prompt_dismissed_at: timestampSchema.nullable(),
  created_at: timestampSchema,
  deleted_at: timestampSchema.nullable(),
  fields_updated_at: z.record(z.string(), z.string()),
  server_updated_at: timestampSchema.nullable().optional(),
});
export type GoalWire = z.infer<typeof goalWireSchema>;

const goalCodec = createSnakeCodec({
  periodKind: "period_kind",
  startDate: "start_date",
  endDate: "end_date",
  targetKind: "target_kind",
  targetCount: "target_count",
  reflectionPromptDismissedAt: "reflection_prompt_dismissed_at",
  createdAt: "created_at",
  deletedAt: "deleted_at",
});

export function goalToWire(goal: Goal, serverUpdatedAt: string | null = null): GoalWire {
  return goalCodec.toWire(goal, serverUpdatedAt) as GoalWire;
}

export function wireToGoal(wire: GoalWire): Goal {
  return goalSchema.parse(goalCodec.fromWire(wire));
}

const GOAL_MERGED_FIELDS = [
  "title",
  "period_kind",
  "start_date",
  "end_date",
  "target_kind",
  "metric",
  "target_count",
  "status",
  "reflection",
  "reflection_prompt_dismissed_at",
  "deleted_at",
] as const satisfies readonly (keyof GoalWire)[];

export function mergeGoal(local: GoalWire, remote: GoalWire): GoalWire {
  return mergeLwwWire(local, remote, GOAL_MERGED_FIELDS);
}

const MAX_SPAN_DAYS = 3 * 366;

function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!) / 86_400_000;
}

/** Cross-field rules; returns an error message or null. Also enforced on push. */
export function validateGoal(goal: Goal): string | null {
  const titleError = validateTitle(goal.title, 200);
  if (titleError) return titleError;
  if (goal.startDate > goal.endDate) return "period start must not be after end";
  if (dayNumber(goal.endDate) - dayNumber(goal.startDate) > MAX_SPAN_DAYS) {
    return "period must not exceed 3 years";
  }
  switch (goal.targetKind) {
    case "domain_count":
      if (goal.metric === null) return "metric required for domain_count";
      if (goal.targetCount === null || goal.targetCount < 1) return "target count must be ≥ 1";
      return null;
    case "checkin_count":
      if (goal.metric !== null) return "metric only applies to domain_count";
      if (goal.targetCount === null || goal.targetCount < 1) return "target count must be ≥ 1";
      return null;
    case "done":
      if (goal.metric !== null) return "metric only applies to domain_count";
      return null;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatUtcDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Start/end dates (inclusive) of the preset period containing `anchor`. Weeks run Monday–Sunday. */
export function periodForPreset(
  kind: Exclude<GoalPeriodKind, "custom">,
  anchor: string,
): { startDate: string; endDate: string } {
  const [y, m, d] = anchor.split("-").map(Number) as [number, number, number];
  switch (kind) {
    case "week": {
      const ms = Date.UTC(y, m - 1, d);
      const mondayOffset = (new Date(ms).getUTCDay() + 6) % 7;
      const start = ms - mondayOffset * 86_400_000;
      return { startDate: formatUtcDay(start), endDate: formatUtcDay(start + 6 * 86_400_000) };
    }
    case "month":
      return { startDate: `${y}-${pad(m)}-01`, endDate: formatUtcDay(Date.UTC(y, m, 0)) };
    case "quarter": {
      const firstMonth = Math.floor((m - 1) / 3) * 3 + 1;
      return {
        startDate: `${y}-${pad(firstMonth)}-01`,
        endDate: formatUtcDay(Date.UTC(y, firstMonth + 2, 0)),
      };
    }
    case "year":
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
  }
}

export const goalCheckinSchema = z.strictObject({
  id: z.uuid(),
  goalId: z.uuid(),
  occurredOn: calendarDateSchema,
  note: z.string().nullable(),
  createdAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
});
export type GoalCheckin = z.infer<typeof goalCheckinSchema>;

export const goalCheckinWireSchema = z.strictObject({
  id: z.uuid(),
  goal_id: z.uuid(),
  occurred_on: calendarDateSchema,
  note: z.string().max(1_000).nullable(),
  created_at: timestampSchema,
  deleted_at: timestampSchema.nullable(),
  fields_updated_at: z.record(z.string(), z.string()),
  server_updated_at: timestampSchema.nullable().optional(),
});
export type GoalCheckinWire = z.infer<typeof goalCheckinWireSchema>;

const checkinCodec = createSnakeCodec({
  goalId: "goal_id",
  occurredOn: "occurred_on",
  createdAt: "created_at",
  deletedAt: "deleted_at",
});

export function goalCheckinToWire(
  checkin: GoalCheckin,
  serverUpdatedAt: string | null = null,
): GoalCheckinWire {
  return checkinCodec.toWire(checkin, serverUpdatedAt) as GoalCheckinWire;
}

export function wireToGoalCheckin(wire: GoalCheckinWire): GoalCheckin {
  return goalCheckinSchema.parse(checkinCodec.fromWire(wire));
}

const CHECKIN_MERGED_FIELDS = [
  "occurred_on",
  "note",
  "deleted_at",
] as const satisfies readonly (keyof GoalCheckinWire)[];

export function mergeGoalCheckin(local: GoalCheckinWire, remote: GoalCheckinWire): GoalCheckinWire {
  return mergeLwwWire(local, remote, CHECKIN_MERGED_FIELDS);
}

export function validateGoalCheckin(checkin: GoalCheckin, today: string): string | null {
  if (isAfterDay(checkin.occurredOn, today)) return "occurredOn must not be in the future";
  if (checkin.note !== null && checkin.note.length > 1_000) return "note too long";
  return null;
}
