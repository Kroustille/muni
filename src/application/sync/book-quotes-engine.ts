import {
  bookQuoteToWire,
  bookQuoteWireSchema,
  type BookQuoteWire,
} from "@/domain/book-quote";
import type { BookQuote } from "@/domain/book-quote";
import type { BookQuoteUseCases } from "../books/book-quotes";
import type { BookQuoteRepository } from "../ports/book-quote-repository";
import type { ItemRepository } from "../ports/item-repository";
import type { BookQuoteRemoteStore } from "../ports/book-quote-remote-store";
import {
  createQuoteSyncEngine,
  type QuarantinedQuoteRow,
  type QuoteSyncRunResult,
} from "./quote-sync-engine";

export type { QuarantinedQuoteRow };

export type BookQuotesSyncRunResult = QuoteSyncRunResult;

export type BookQuotesSyncEngineDeps = {
  repository: BookQuoteRepository;
  meta: ItemRepository["meta"];
  remote: BookQuoteRemoteStore;
  quotes: Pick<BookQuoteUseCases, "applyRemote">;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
};

export type BookQuotesSyncEngine = {
  run(): Promise<BookQuotesSyncRunResult>;
  readonly paused: boolean;
  resume(): void;
};

function zodIssueMessage(parsed: ReturnType<typeof bookQuoteWireSchema.safeParse>): string {
  if (parsed.success) return "";
  return parsed.error.issues
    .map((issue) =>
      issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    )
    .join("; ");
}

export function createBookQuotesSyncEngine(deps: BookQuotesSyncEngineDeps): BookQuotesSyncEngine {
  return createQuoteSyncEngine<BookQuote, BookQuoteWire>({
    ...deps,
    pullCursorMetaKey: "quotePullCursor",
    toWire: bookQuoteToWire,
    safeParseWire: (wire) => {
      const parsed = bookQuoteWireSchema.safeParse(wire);
      if (parsed.success) return { success: true, data: parsed.data };
      return { success: false, message: zodIssueMessage(parsed) };
    },
  });
}
