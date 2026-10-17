import {
  movieQuoteToWire,
  movieQuoteWireSchema,
  type MovieQuoteWire,
} from "@/domain/movie-quote";
import type { MovieQuote } from "@/domain/movie-quote";
import type { MovieQuoteUseCases } from "../movies/movie-quotes";
import type { MovieQuoteRepository } from "../ports/movie-quote-repository";
import type { ItemRepository } from "../ports/item-repository";
import type { MovieQuoteRemoteStore } from "../ports/movie-quote-remote-store";
import {
  createQuoteSyncEngine,
  type QuarantinedQuoteRow,
  type QuoteSyncRunResult,
} from "./quote-sync-engine";

export type { QuarantinedQuoteRow };

export type MovieQuotesSyncRunResult = QuoteSyncRunResult;

export type MovieQuotesSyncEngineDeps = {
  repository: MovieQuoteRepository;
  meta: ItemRepository["meta"];
  remote: MovieQuoteRemoteStore;
  quotes: Pick<MovieQuoteUseCases, "applyRemote">;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
};

export type MovieQuotesSyncEngine = {
  run(): Promise<MovieQuotesSyncRunResult>;
  readonly paused: boolean;
  resume(): void;
};

function zodIssueMessage(parsed: ReturnType<typeof movieQuoteWireSchema.safeParse>): string {
  if (parsed.success) return "";
  return parsed.error.issues
    .map((issue) =>
      issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    )
    .join("; ");
}

export function createMovieQuotesSyncEngine(deps: MovieQuotesSyncEngineDeps): MovieQuotesSyncEngine {
  return createQuoteSyncEngine<MovieQuote, MovieQuoteWire>({
    ...deps,
    pullCursorMetaKey: "movieQuotePullCursor",
    toWire: movieQuoteToWire,
    safeParseWire: (wire) => {
      const parsed = movieQuoteWireSchema.safeParse(wire);
      if (parsed.success) return { success: true, data: parsed.data };
      return { success: false, message: zodIssueMessage(parsed) };
    },
  });
}
