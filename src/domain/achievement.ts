import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";
import {
  calendarDateSchema,
  createSnakeCodec,
  isAfterDay,
  MAX_LINKS,
  souvenirLinkSchema,
  timestampSchema,
  validateTitle,
} from "@/domain/memories-growth-shared";

/**
 * Private achievements (réalisations, 015 US5). Auto rows use a deterministic id
 * (`deterministicUuid(MEMORIES_NAMESPACE, "${ruleId}:${threshold}")`) so devices converge.
 */

export const achievementOrigins = ["auto", "manual"] as const;
export type AchievementOrigin = (typeof achievementOrigins)[number];

export const achievementSchema = z.strictObject({
  id: z.uuid(),
  origin: z.enum(achievementOrigins),
  ruleId: z.string().nullable(),
  ruleVersion: z.number().int().nullable(),
  threshold: z.number().int().nullable(),
  title: z.string(),
  earnedOn: calendarDateSchema,
  body: z.string().nullable(),
  links: z.array(souvenirLinkSchema),
  celebratedAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const achievementWireSchema = z
  .strictObject({
    id: z.uuid(),
    origin: z.enum(achievementOrigins),
    rule_id: z.string().max(100).nullable(),
    rule_version: z.number().int().nullable(),
    threshold: z.number().int().min(1).nullable(),
    title: z.string().trim().min(1).max(200),
    earned_on: calendarDateSchema,
    body: z.string().max(5_000).nullable(),
    links: z.array(souvenirLinkSchema).max(MAX_LINKS),
    celebrated_at: timestampSchema.nullable(),
    created_at: timestampSchema,
    deleted_at: timestampSchema.nullable(),
    fields_updated_at: z.record(z.string(), z.string()),
    server_updated_at: timestampSchema.nullable().optional(),
  })
  .refine((w) => w.origin !== "auto" || (w.rule_id !== null && w.threshold !== null), {
    message: "auto achievements require rule_id and threshold",
  });
export type AchievementWire = z.infer<typeof achievementWireSchema>;

const codec = createSnakeCodec({
  ruleId: "rule_id",
  ruleVersion: "rule_version",
  earnedOn: "earned_on",
  celebratedAt: "celebrated_at",
  createdAt: "created_at",
  deletedAt: "deleted_at",
});

export function achievementToWire(
  achievement: Achievement,
  serverUpdatedAt: string | null = null,
): AchievementWire {
  return codec.toWire(achievement, serverUpdatedAt) as AchievementWire;
}

export function wireToAchievement(wire: AchievementWire): Achievement {
  return achievementSchema.parse(codec.fromWire(wire));
}

const MERGED_FIELDS = [
  "title",
  "earned_on",
  "body",
  "links",
  "celebrated_at",
  "deleted_at",
] as const satisfies readonly (keyof AchievementWire)[];

export function mergeAchievement(local: AchievementWire, remote: AchievementWire): AchievementWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

export function validateAchievement(achievement: Achievement, today: string): string | null {
  const titleError = validateTitle(achievement.title, 200);
  if (titleError) return titleError;
  if (
    achievement.origin === "auto" &&
    (achievement.ruleId === null || achievement.threshold === null)
  ) {
    return "auto achievements require rule and threshold";
  }
  if (isAfterDay(achievement.earnedOn, today)) return "earnedOn must not be in the future";
  if (achievement.body !== null && achievement.body.length > 5_000) return "body too long";
  if (achievement.links.length > MAX_LINKS) return `links max ${MAX_LINKS}`;
  return null;
}
