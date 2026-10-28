import type { Json } from "./db-types";

/** Normalize jsonb / driver quirks so domain zod always sees arrays. */
export function toJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function toUuidArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Ensure values bound to jsonb columns are plain JSON (avoids pg array coercion). */
export function toJsonColumn(value: unknown): Json {
  if (value === undefined || value === null) return null as unknown as Json;
  if (typeof value === "string") return value as unknown as Json;
  // node-pg maps JS arrays to PostgreSQL array types; jsonb needs a JSON string or plain object.
  if (Array.isArray(value)) return JSON.stringify(value) as unknown as Json;
  return JSON.parse(JSON.stringify(value)) as Json;
}
