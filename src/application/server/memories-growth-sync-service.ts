import type {
  MemoriesGrowthPayload,
  MemoriesGrowthPullResult,
  MemoriesGrowthServerRepositories,
  ServerSyncedRepository,
} from "@/application/ports/memories-growth-repositories";
import { achievementWireSchema, mergeAchievement } from "@/domain/achievement";
import {
  goalCheckinWireSchema,
  goalWireSchema,
  mergeGoal,
  mergeGoalCheckin,
  validateGoal,
  wireToGoal,
} from "@/domain/goal";
import { mergeSouvenir, souvenirWireSchema } from "@/domain/souvenir";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

/** Server side of `/api/sync/memories-growth/*` (015). Mirrors 013 plants-garden sync. */
export type MemoriesGrowthSyncService = {
  push(userId: string, body: MemoriesGrowthPayload): Promise<MemoriesGrowthPayload>;
  pull(userId: string, since: string | null, limit: number): Promise<MemoriesGrowthPullResult>;
};

type SafeParser<T> = {
  safeParse(
    value: unknown,
  ): { success: true; data: T } | { success: false; error: { issues: { message: string }[] } };
};

function validateRows<T>(
  rows: unknown[],
  label: string,
  schema: SafeParser<T>,
  extra?: (row: T) => string | null,
): T[] {
  const errors: RowError[] = [];
  const valid: T[] = [];
  rows.forEach((row, index) => {
    if (row === null || typeof row !== "object") {
      errors.push({ index, message: `invalid ${label}` });
      return;
    }
    const record = row as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : undefined;
    if (Object.prototype.hasOwnProperty.call(record, "user_id")) {
      errors.push({ index, id, message: "user_id must not be present" });
      return;
    }
    const parsed = schema.safeParse(row);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      errors.push({ index, id, message: message || `invalid ${label}` });
      return;
    }
    const extraError = extra?.(parsed.data) ?? null;
    if (extraError) {
      errors.push({ index, id, message: extraError });
      return;
    }
    valid.push(parsed.data);
  });
  if (errors.length > 0) throw new SyncValidationError(errors);
  return valid;
}

export function validatePushMemoriesGrowth(body: {
  souvenirs?: unknown[];
  goals?: unknown[];
  goalCheckins?: unknown[];
  achievements?: unknown[];
}): MemoriesGrowthPayload {
  return {
    souvenirs: validateRows(body.souvenirs ?? [], "souvenir", souvenirWireSchema),
    goals: validateRows(body.goals ?? [], "goal", goalWireSchema, (wire) =>
      validateGoal(wireToGoal(wire)),
    ),
    goalCheckins: validateRows(body.goalCheckins ?? [], "goal check-in", goalCheckinWireSchema),
    achievements: validateRows(body.achievements ?? [], "achievement", achievementWireSchema),
  };
}

async function pushRows<W extends { id: string; server_updated_at?: string | null }>(
  userId: string,
  repo: ServerSyncedRepository<W>,
  incoming: W[],
  merge: (local: W, remote: W) => W,
  now: () => Date,
): Promise<W[]> {
  return repo.transaction(async (tx) => {
    const results: W[] = [];
    for (const row of incoming) {
      const [existing] = await tx.findByIds(userId, [row.id]);
      let merged: W;
      if (existing === undefined) {
        merged = { ...row, server_updated_at: now().toISOString() };
      } else {
        const { server_updated_at: _incomingStamp, ...incomingRest } = row;
        const { server_updated_at: _existingStamp, ...existingRest } = existing;
        void _incomingStamp;
        void _existingStamp;
        merged =
          JSON.stringify(incomingRest) === JSON.stringify(existingRest)
            ? existing
            : { ...merge(row, existing), server_updated_at: now().toISOString() };
      }
      results.push(await tx.upsert(userId, merged));
    }
    return results;
  });
}

/**
 * Each table is paged independently. If any table returned a full page, the
 * cursor must not pass that table's last row, or its remaining rows would be
 * skipped; rows already sent from other tables are simply re-sent (idempotent).
 */
export function pullCursor(
  pages: readonly { server_updated_at?: string | null }[][],
  limit: number,
  since: string | null,
): { cursor: string; hasMore: boolean } {
  const lastStamp = (page: readonly { server_updated_at?: string | null }[]) =>
    page.at(-1)?.server_updated_at ?? null;
  const fullPageEnds = pages
    .filter((page) => page.length >= limit)
    .map(lastStamp)
    .filter((stamp): stamp is string => stamp !== null)
    .sort();
  if (fullPageEnds.length > 0) return { cursor: fullPageEnds[0]!, hasMore: true };
  const latest = pages
    .flat()
    .map((row) => row.server_updated_at ?? null)
    .filter((stamp): stamp is string => stamp !== null)
    .sort()
    .at(-1);
  return { cursor: latest ?? since ?? "", hasMore: false };
}

export function createMemoriesGrowthSyncService(
  deps: MemoriesGrowthServerRepositories & { now?: () => Date },
): MemoriesGrowthSyncService {
  const now = deps.now ?? (() => new Date());

  return {
    async push(userId, body) {
      if (!userId) throw new SyncAuthError();
      const validated = validatePushMemoriesGrowth(body);

      const souvenirs = await pushRows(
        userId,
        deps.souvenirs,
        validated.souvenirs,
        mergeSouvenir,
        now,
      );
      // Goals before check-ins: a batch may create a goal and its first check-in together.
      const goals = await pushRows(userId, deps.goals, validated.goals, mergeGoal, now);

      const referenced = [...new Set(validated.goalCheckins.map((c) => c.goal_id))];
      const owned = await deps.goalCheckins.existingGoalIds(userId, referenced);
      const orphanErrors: RowError[] = validated.goalCheckins.flatMap((checkin, index) =>
        owned.has(checkin.goal_id) ? [] : [{ index, id: checkin.id, message: "goal_id not found" }],
      );
      if (orphanErrors.length > 0) throw new SyncValidationError(orphanErrors);
      const goalCheckins = await pushRows(
        userId,
        deps.goalCheckins,
        validated.goalCheckins,
        mergeGoalCheckin,
        now,
      );

      const achievements = await pushRows(
        userId,
        deps.achievements,
        validated.achievements,
        mergeAchievement,
        now,
      );
      return { souvenirs, goals, goalCheckins, achievements };
    },

    async pull(userId, since, limit) {
      if (!userId) throw new SyncAuthError();
      const sinceDate = since === null ? null : new Date(since);
      const [souvenirs, goals, goalCheckins, achievements] = await Promise.all([
        deps.souvenirs.pullSince(userId, sinceDate, limit),
        deps.goals.pullSince(userId, sinceDate, limit),
        deps.goalCheckins.pullSince(userId, sinceDate, limit),
        deps.achievements.pullSince(userId, sinceDate, limit),
      ]);
      return {
        souvenirs,
        goals,
        goalCheckins,
        achievements,
        ...pullCursor([souvenirs, goals, goalCheckins, achievements], limit, since),
      };
    },
  };
}
