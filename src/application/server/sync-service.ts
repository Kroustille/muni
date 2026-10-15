import { merge } from "@/domain/merge";
import { itemWireSchema, type ItemWire } from "@/domain/item";
import type { ServerItemRepository } from "@/application/ports/server-item-repository";

export type RowError = { id?: string; index?: number; message: string };

export class SyncValidationError extends Error {
  constructor(readonly rowErrors: RowError[]) {
    super("validation");
    this.name = "SyncValidationError";
  }
}

export class SyncAuthError extends Error {
  constructor() {
    super("unauthenticated");
    this.name = "SyncAuthError";
  }
}

export type SyncService = {
  push(userId: string, items: ItemWire[]): Promise<ItemWire[]>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{ items: ItemWire[]; cursor: string }>;
};

type SyncServiceDeps = {
  repository: ServerItemRepository;
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

function validatePushPayload(items: ItemWire[]): ItemWire[] {
  const rowErrors: RowError[] = [];
  const validated: ItemWire[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    if (Object.prototype.hasOwnProperty.call(item, "user_id")) {
      rowErrors.push({
        index,
        id: item.id,
        message: "user_id must not be present",
      });
      continue;
    }
    const parsed = itemWireSchema.safeParse(item);
    if (!parsed.success) {
      rowErrors.push({
        index,
        id: item.id,
        message: formatZodIssues(parsed.error),
      });
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

export function createSyncService(deps: SyncServiceDeps): SyncService {
  const now = deps.now ?? (() => new Date());
  const { repository } = deps;

  return {
    async push(userId, items) {
      assertUserId(userId);
      const validated = validatePushPayload(items);

      return repository.transaction(async (repo) => {
        const results: ItemWire[] = [];
        for (const incoming of validated) {
          const locked = await repo.findByIds(userId, [incoming.id]);
          const existing = locked[0];

          let merged: ItemWire;
          if (!existing) {
            merged = {
              ...incoming,
              server_updated_at: serverUpdatedAtIso(now),
            };
          } else if (JSON.stringify(incoming) === JSON.stringify(existing)) {
            merged = existing;
          } else {
            merged = {
              ...merge(incoming, existing),
              server_updated_at: serverUpdatedAtIso(now),
            };
          }

          await repo.upsert(userId, [merged]);
          results.push(merged);
        }
        return results;
      });
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const batch = await repository.listSince(userId, since, limit);
      const last = batch.at(-1);
      const cursor = last?.server_updated_at ?? since ?? "";
      return { items: batch, cursor };
    },
  };
}
