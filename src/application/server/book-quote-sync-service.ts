import {
  bookQuoteToWire,
  bookQuoteWireSchema,
  mergeBookQuote,
  wireToBookQuote,
  type BookQuoteWire,
} from "@/domain/book-quote";
import type { ServerBookQuoteRepository } from "@/application/ports/book-quote-repository";
import type { ServerItemRepository } from "@/application/ports/server-item-repository";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type BookQuoteSyncService = {
  push(userId: string, quotes: BookQuoteWire[]): Promise<BookQuoteWire[]>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{ quotes: BookQuoteWire[]; cursor: string }>;
};

type BookQuoteSyncServiceDeps = {
  quotes: ServerBookQuoteRepository;
  items: ServerItemRepository;
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

export function validatePushQuotes(quotes: unknown[]): BookQuoteWire[] {
  const rowErrors: RowError[] = [];
  const validated: BookQuoteWire[] = [];

  for (let index = 0; index < quotes.length; index++) {
    const quote = quotes[index];
    if (quote === null || typeof quote !== "object") {
      rowErrors.push({ index, message: "invalid quote" });
      continue;
    }
    const record = quote as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : undefined;
    if (Object.prototype.hasOwnProperty.call(record, "user_id")) {
      rowErrors.push({ index, id, message: "user_id must not be present" });
      continue;
    }
    const parsed = bookQuoteWireSchema.safeParse(quote);
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

async function assertBookParent(
  userId: string,
  bookItemId: string,
  items: ServerItemRepository,
): Promise<void> {
  const parents = await items.findByIds(userId, [bookItemId]);
  const parent = parents[0];
  if (parent === undefined || parent.type !== "book" || parent.deleted_at !== null) {
    throw new SyncValidationError([
      { id: bookItemId, message: "book_item_id must reference an active book item" },
    ]);
  }
}

export function createBookQuoteSyncService(deps: BookQuoteSyncServiceDeps): BookQuoteSyncService {
  const now = deps.now ?? (() => new Date());
  const { quotes, items } = deps;

  return {
    async push(userId, incomingQuotes) {
      assertUserId(userId);
      const validated = validatePushQuotes(incomingQuotes);

      const bookIds = [...new Set(validated.map((quote) => quote.book_item_id))];
      await items.transaction(async (itemRepo) => {
        for (const bookId of bookIds) {
          await assertBookParent(userId, bookId, itemRepo);
        }
      });

      return quotes.transaction(async (quoteRepo) => {
        const results: BookQuoteWire[] = [];
        for (const incoming of validated) {
          const locked = await quoteRepo.findByIds(userId, [incoming.id]);
          const existing = locked[0];

          let merged: BookQuoteWire;
          if (!existing) {
            merged = {
              ...incoming,
              server_updated_at: serverUpdatedAtIso(now),
            };
          } else {
            const existingWire = bookQuoteToWire(existing);
            if (JSON.stringify(incoming) === JSON.stringify(existingWire)) {
              merged = { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null };
            } else {
              merged = {
                ...mergeBookQuote(incoming, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
            }
          }

          const saved = await quoteRepo.upsert(userId, wireToBookQuote(merged));
          results.push(bookQuoteToWire(saved, merged.server_updated_at ?? null));
        }
        return results;
      });
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const batch = await quotes.pullSince(userId, since === null ? null : new Date(since), limit);
      const wires = batch.map((row) => bookQuoteToWire(row));
      const last = wires.at(-1);
      const cursor = last?.server_updated_at ?? since ?? "";
      return { quotes: wires, cursor };
    },
  };
}
