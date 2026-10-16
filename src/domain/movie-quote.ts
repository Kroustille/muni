import { z } from "zod";

import { compareHlc } from "./clock";

const timestamp = z.iso.datetime({ offset: true });

export type MovieQuote = {
  id: string;
  movieItemId: string;
  text: string;
  context: string | null;
  createdAt: string;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const movieQuoteShape = {
  id: z.uuid(),
  movieItemId: z.uuid(),
  text: z.string().trim().min(1).max(4000),
  context: z.string().trim().max(500).nullable(),
  createdAt: timestamp,
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const movieQuoteSchema = z.strictObject(movieQuoteShape);

const SNAKE: Partial<Record<keyof MovieQuote, string>> = {
  movieItemId: "movie_item_id",
  createdAt: "created_at",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof MovieQuote] ?? field;

const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));

const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const movieQuoteWireSchema = z.strictObject({
  id: movieQuoteShape.id,
  movie_item_id: movieQuoteShape.movieItemId,
  text: movieQuoteShape.text,
  context: movieQuoteShape.context,
  created_at: movieQuoteShape.createdAt,
  deleted_at: movieQuoteShape.deletedAt,
  fields_updated_at: movieQuoteShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type MovieQuoteWire = z.infer<typeof movieQuoteWireSchema>;

export type NewMovieQuoteInput = {
  id: string;
  movieItemId: string;
  text: string;
  createdAt: string;
  context?: string | null;
};

export function newMovieQuote(input: NewMovieQuoteInput): MovieQuote {
  const candidate: MovieQuote = {
    id: input.id,
    movieItemId: input.movieItemId,
    text: input.text,
    context: input.context ?? null,
    createdAt: input.createdAt,
    deletedAt: null,
    fieldsUpdatedAt: {},
  };
  return movieQuoteSchema.parse(candidate) as MovieQuote;
}

export function movieQuoteToWire(
  quote: MovieQuote,
  serverUpdatedAt: string | null = null,
): MovieQuoteWire {
  const { fieldsUpdatedAt, ...rest } = quote;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<MovieQuoteWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToMovieQuote(wire: MovieQuoteWire): MovieQuote {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return movieQuoteSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as MovieQuote;
}

const MERGED_QUOTE_FIELDS = ["text", "context", "deleted_at"] as const satisfies readonly (keyof MovieQuoteWire)[];

function compareValues(a: unknown, b: unknown): number {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x === y) return 0;
  return x < y ? -1 : 1;
}

function laterNonNull(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}

/** Per-field LWW merge for quote sync (same rules as items). */
export function mergeMovieQuote(local: MovieQuoteWire, remote: MovieQuoteWire): MovieQuoteWire {
  const result = structuredClone(local) as Record<string, unknown>;
  const timestamps: Record<string, string> = {};

  for (const field of MERGED_QUOTE_FIELDS) {
    const l = local.fields_updated_at[field];
    const r = remote.fields_updated_at[field];
    let remoteWins: boolean;
    if (l !== undefined && r !== undefined) {
      const order = compareHlc(l, r);
      remoteWins = order !== 0 ? order < 0 : compareValues(local[field], remote[field]) < 0;
    } else if (l === undefined && r === undefined) {
      remoteWins = compareValues(local[field], remote[field]) < 0;
    } else {
      remoteWins = l === undefined;
    }
    const winner = remoteWins ? remote : local;
    result[field] = structuredClone(winner[field]);
    const stamp = winner.fields_updated_at[field];
    if (stamp !== undefined) timestamps[field] = stamp;
  }

  for (const [key, value] of [
    ...Object.entries(local.fields_updated_at),
    ...Object.entries(remote.fields_updated_at),
  ]) {
    if (!(MERGED_QUOTE_FIELDS as readonly string[]).includes(key)) {
      const current = timestamps[key];
      if (current === undefined || compareHlc(value, current) > 0) timestamps[key] = value;
    }
  }

  result.fields_updated_at = timestamps;
  result.server_updated_at = laterNonNull(
    local.server_updated_at ?? null,
    remote.server_updated_at ?? null,
  );
  return result as MovieQuoteWire;
}
