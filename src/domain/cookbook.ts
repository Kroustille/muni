import { z } from "zod";

import { compareHlc } from "./clock";

const timestamp = z.iso.datetime({ offset: true });

export type Cookbook = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  createdAt: string;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const nullableTrimmed = (max: number) =>
  z
    .union([z.null(), z.string()])
    .transform((value) => {
      if (value === null) return null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    })
    .pipe(z.union([z.null(), z.string().min(1).max(max)]));

const cookbookShape = {
  id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  author: nullableTrimmed(200),
  isbn: nullableTrimmed(32),
  createdAt: timestamp,
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const cookbookSchema = z.strictObject(cookbookShape);

const SNAKE: Partial<Record<keyof Cookbook, string>> = {
  createdAt: "created_at",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof Cookbook] ?? field;

const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));

const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const cookbookWireSchema = z.strictObject({
  id: cookbookShape.id,
  title: cookbookShape.title,
  author: cookbookShape.author,
  isbn: cookbookShape.isbn,
  created_at: cookbookShape.createdAt,
  deleted_at: cookbookShape.deletedAt,
  fields_updated_at: cookbookShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type CookbookWire = z.infer<typeof cookbookWireSchema>;

export type NewCookbookInput = {
  id: string;
  title: string;
  createdAt: string;
  author?: string | null;
  isbn?: string | null;
};

export function newCookbook(input: NewCookbookInput): Cookbook {
  const candidate: Cookbook = {
    id: input.id,
    title: input.title.trim(),
    author: input.author ?? null,
    isbn: input.isbn ?? null,
    createdAt: input.createdAt,
    deletedAt: null,
    fieldsUpdatedAt: {},
  };
  return cookbookSchema.parse(candidate) as Cookbook;
}

export type UpsertCookbookInput = {
  id?: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
};

export function upsertCookbookFields(
  existing: Cookbook | undefined,
  input: UpsertCookbookInput,
  createdAt: string,
): Cookbook {
  const id = input.id ?? existing?.id;
  if (id === undefined) {
    throw new Error("cookbook id required");
  }
  const title = input.title.trim();
  const author =
    input.author === undefined
      ? (existing?.author ?? null)
      : input.author === null
        ? null
        : input.author.trim() === ""
          ? null
          : input.author.trim();
  const isbn =
    input.isbn === undefined
      ? (existing?.isbn ?? null)
      : input.isbn === null
        ? null
        : input.isbn.trim() === ""
          ? null
          : input.isbn.trim();

  const base: Cookbook = existing ?? {
    id,
    title,
    author,
    isbn,
    createdAt,
    deletedAt: null,
    fieldsUpdatedAt: {},
  };

  return cookbookSchema.parse({
    ...base,
    id,
    title,
    author,
    isbn,
  }) as Cookbook;
}

export function cookbookToWire(
  cookbook: Cookbook,
  serverUpdatedAt: string | null = null,
): CookbookWire {
  const { fieldsUpdatedAt, ...rest } = cookbook;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<CookbookWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToCookbook(wire: CookbookWire): Cookbook {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return cookbookSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as Cookbook;
}

const MERGED_COOKBOOK_FIELDS = ["title", "author", "isbn", "deleted_at"] as const satisfies readonly (keyof CookbookWire)[];

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

export function mergeCookbook(local: CookbookWire, remote: CookbookWire): CookbookWire {
  const result = structuredClone(local) as Record<string, unknown>;
  const timestamps: Record<string, string> = {};

  for (const field of MERGED_COOKBOOK_FIELDS) {
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
    if (!(MERGED_COOKBOOK_FIELDS as readonly string[]).includes(key)) {
      const current = timestamps[key];
      if (current === undefined || compareHlc(value, current) > 0) timestamps[key] = value;
    }
  }

  result.fields_updated_at = timestamps;
  result.server_updated_at = laterNonNull(
    local.server_updated_at ?? null,
    remote.server_updated_at ?? null,
  );
  return result as CookbookWire;
}
