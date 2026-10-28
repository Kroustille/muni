import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export type PracticeInstrument = {
  id: string;
  name: string;
  notes: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const instrumentShape = {
  id: z.uuid(),
  name: z.string().trim().min(1).max(200),
  notes: z.string().max(2000).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const practiceInstrumentSchema = z.strictObject(instrumentShape);

const SNAKE: Partial<Record<keyof PracticeInstrument, string>> = {
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof PracticeInstrument] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const practiceInstrumentWireSchema = z.strictObject({
  id: instrumentShape.id,
  name: instrumentShape.name,
  notes: instrumentShape.notes,
  deleted_at: instrumentShape.deletedAt,
  fields_updated_at: instrumentShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PracticeInstrumentWire = z.infer<typeof practiceInstrumentWireSchema>;

export function practiceInstrumentToWire(
  instrument: PracticeInstrument,
  serverUpdatedAt: string | null = null,
): PracticeInstrumentWire {
  const { fieldsUpdatedAt, ...rest } = instrument;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PracticeInstrumentWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPracticeInstrument(wire: PracticeInstrumentWire): PracticeInstrument {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return practiceInstrumentSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as PracticeInstrument;
}

const MERGED_FIELDS = ["name", "notes", "deleted_at"] as const satisfies readonly (keyof PracticeInstrumentWire)[];

export function mergePracticeInstrument(
  local: PracticeInstrumentWire,
  remote: PracticeInstrumentWire,
): PracticeInstrumentWire {
  return mergeLwwWire(local, remote, MERGED_FIELDS);
}

export function validatePracticeInstrument(instrument: PracticeInstrument): string | null {
  if (instrument.name.trim().length === 0) return "name required";
  return null;
}
