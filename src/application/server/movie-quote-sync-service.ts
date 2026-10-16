import {
  movieQuoteToWire,
  movieQuoteWireSchema,
  mergeMovieQuote,
  wireToMovieQuote,
  type MovieQuoteWire,
} from "@/domain/movie-quote";
import type { ServerMovieQuoteRepository } from "@/application/ports/movie-quote-repository";
import type { ServerItemRepository } from "@/application/ports/server-item-repository";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type MovieQuoteSyncService = {
  push(userId: string, quotes: MovieQuoteWire[]): Promise<MovieQuoteWire[]>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{ quotes: MovieQuoteWire[]; cursor: string }>;
};

type MovieQuoteSyncServiceDeps = {
  quotes: ServerMovieQuoteRepository;
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

export function validatePushMovieQuotes(quotes: unknown[]): MovieQuoteWire[] {
  const rowErrors: RowError[] = [];
  const validated: MovieQuoteWire[] = [];

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
    const parsed = movieQuoteWireSchema.safeParse(quote);
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
  movieItemId: string,
  items: ServerItemRepository,
): Promise<void> {
  const parents = await items.findByIds(userId, [movieItemId]);
  const parent = parents[0];
  if (parent === undefined || parent.type !== "movie" || parent.deleted_at !== null) {
    throw new SyncValidationError([
      { id: movieItemId, message: "movie_item_id must reference an active book item" },
    ]);
  }
}

export function createMovieQuoteSyncService(deps: MovieQuoteSyncServiceDeps): MovieQuoteSyncService {
  const now = deps.now ?? (() => new Date());
  const { quotes, items } = deps;

  return {
    async push(userId, incomingQuotes) {
      assertUserId(userId);
      const validated = validatePushMovieQuotes(incomingQuotes);

      const bookIds = [...new Set(validated.map((quote) => quote.movie_item_id))];
      await items.transaction(async (itemRepo) => {
        for (const bookId of bookIds) {
          await assertBookParent(userId, bookId, itemRepo);
        }
      });

      return quotes.transaction(async (quoteRepo) => {
        const results: MovieQuoteWire[] = [];
        for (const incoming of validated) {
          const locked = await quoteRepo.findByIds(userId, [incoming.id]);
          const existing = locked[0];

          let merged: MovieQuoteWire;
          if (!existing) {
            merged = {
              ...incoming,
              server_updated_at: serverUpdatedAtIso(now),
            };
          } else {
            const existingWire = movieQuoteToWire(existing);
            if (JSON.stringify(incoming) === JSON.stringify(existingWire)) {
              merged = { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null };
            } else {
              merged = {
                ...mergeMovieQuote(incoming, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
            }
          }

          const saved = await quoteRepo.upsert(userId, wireToMovieQuote(merged));
          results.push(movieQuoteToWire(saved, merged.server_updated_at ?? null));
        }
        return results;
      });
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const batch = await quotes.pullSince(userId, since === null ? null : new Date(since), limit);
      const wires = batch.map((row) => movieQuoteToWire(row));
      const last = wires.at(-1);
      const cursor = last?.server_updated_at ?? since ?? "";
      return { quotes: wires, cursor };
    },
  };
}
