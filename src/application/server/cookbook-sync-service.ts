import {
  cookbookToWire,
  cookbookWireSchema,
  mergeCookbook,
  wireToCookbook,
  type CookbookWire,
} from "@/domain/cookbook";
import type { ServerCookbookRepository } from "@/application/ports/cookbook-repository";
import type { ItemWire } from "@/domain/item";
import type { ServerItemRepository } from "@/application/ports/server-item-repository";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type CookbookSyncService = {
  push(userId: string, cookbooks: CookbookWire[]): Promise<CookbookWire[]>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{ cookbooks: CookbookWire[]; cursor: string }>;
};

type CookbookSyncServiceDeps = {
  cookbooks: ServerCookbookRepository;
  now?: () => Date;
};

function assertUserId(userId: string): void {
  if (!userId) {
    throw new SyncAuthError();
  }
}

function formatZodIssues(error: { issues: { message: string }[] }): string {
  const messages = error.issues.map((issue) => issue.message).filter(Boolean);
  return messages.length > 0 ? messages.join("; ") : "validation failed";
}

export function validatePushCookbooks(cookbooks: unknown[]): CookbookWire[] {
  const rowErrors: RowError[] = [];
  const validated: CookbookWire[] = [];

  for (let index = 0; index < cookbooks.length; index++) {
    const cookbook = cookbooks[index];
    if (cookbook === null || typeof cookbook !== "object") {
      rowErrors.push({ index, message: "invalid cookbook" });
      continue;
    }
    const record = cookbook as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : undefined;
    if (Object.prototype.hasOwnProperty.call(record, "user_id")) {
      rowErrors.push({ index, id, message: "user_id must not be present" });
      continue;
    }
    const parsed = cookbookWireSchema.safeParse(cookbook);
    if (!parsed.success) {
      rowErrors.push({ index, id, message: formatZodIssues(parsed.error) });
      continue;
    }
    validated.push(parsed.data);
  }

  if (rowErrors.length > 0) {
    throw new SyncValidationError(rowErrors);
  }
  return validated;
}

function serverUpdatedAtIso(now: () => Date): string {
  return now().toISOString();
}

export function createCookbookSyncService(deps: CookbookSyncServiceDeps): CookbookSyncService {
  const now = deps.now ?? (() => new Date());
  const { cookbooks } = deps;

  return {
    async push(userId, incoming) {
      assertUserId(userId);
      const validated = validatePushCookbooks(incoming);

      return cookbooks.transaction(async (repo) => {
        const results: CookbookWire[] = [];
        for (const row of validated) {
          const locked = await repo.findByIds(userId, [row.id]);
          const existing = locked[0];
          let merged: CookbookWire;
          if (!existing) {
            merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
          } else {
            const existingWire = cookbookToWire(existing);
            if (JSON.stringify(row) === JSON.stringify(existingWire)) {
              merged = { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null };
            } else {
              merged = {
                ...mergeCookbook(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
            }
          }
          const saved = await repo.upsert(userId, wireToCookbook(merged));
          results.push(cookbookToWire(saved, merged.server_updated_at ?? null));
        }
        return results;
      });
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const batch = await cookbooks.pullSince(
        userId,
        since === null ? null : new Date(since),
        limit,
      );
      const wires = batch.map((row) => cookbookToWire(row));
      const last = wires.at(-1);
      const cursor = last?.server_updated_at ?? since ?? "";
      return { cookbooks: wires, cursor };
    },
  };
}

export async function assertRecipeCookbookRefs(
  userId: string,
  items: ItemWire[],
  cookbooks: ServerCookbookRepository,
): Promise<void> {
  const cookbookIds = [
    ...new Set(
      items
        .filter((item) => item.type === "recipe" && item.cookbook_id)
        .map((item) => item.cookbook_id as string),
    ),
  ];
  if (cookbookIds.length === 0) return;

  await cookbooks.transaction(async (repo) => {
    const rows = await repo.findByIds(userId, cookbookIds);
    const active = new Set(
      rows.filter((row) => row.deletedAt === null).map((row) => row.id),
    );
    const errors: RowError[] = [];
    for (const item of items) {
      if (item.type !== "recipe") continue;
      if (item.source_page && !item.cookbook_id) {
        errors.push({ id: item.id, message: "source_page requires cookbook_id" });
      }
      if (item.cookbook_id && !active.has(item.cookbook_id)) {
        errors.push({ id: item.id, message: "cookbook_id must reference an active cookbook" });
      }
    }
    if (errors.length > 0) throw new SyncValidationError(errors);
  });
}
