import type { BookQuoteWire } from "@/domain/book-quote";

import type { RowError } from "./remote-store";

export type BookQuotePullResult = { quotes: BookQuoteWire[]; cursor: string };

export interface BookQuoteRemoteStore {
  push(quotes: BookQuoteWire[]): Promise<BookQuoteWire[]>;
  pull(since: string | null, limit: number): Promise<BookQuotePullResult>;
}

export type { RowError };
