import type { MovieQuoteWire } from "@/domain/movie-quote";

import type { RowError } from "./remote-store";

export type MovieQuotePullResult = { quotes: MovieQuoteWire[]; cursor: string };

export interface MovieQuoteRemoteStore {
  push(quotes: MovieQuoteWire[]): Promise<MovieQuoteWire[]>;
  pull(since: string | null, limit: number): Promise<MovieQuotePullResult>;
}

export type { RowError };
