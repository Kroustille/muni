import { z } from "zod";

/** Shared building blocks for 015 entities (souvenir, goal, goal_checkin, achievement). */

export const timestampSchema = z.iso.datetime({ offset: true });
export const calendarDateSchema = z.iso.date();

export const souvenirLinkKinds = ["item", "fitness_workout", "plant"] as const;
export type SouvenirLinkKind = (typeof souvenirLinkKinds)[number];

export const souvenirLinkSchema = z.strictObject({
  kind: z.enum(souvenirLinkKinds),
  id: z.uuid(),
});
export type SouvenirLink = z.infer<typeof souvenirLinkSchema>;

export const MAX_LINKS = 10;

/** Calendar dates are ISO `YYYY-MM-DD`, so string comparison is chronological. */
export function isAfterDay(date: string, today: string): boolean {
  return date > today;
}

export function validateTitle(title: string, max: number): string | null {
  const length = title.trim().length;
  if (length < 1 || length > max) return `title length 1-${max}`;
  return null;
}

/**
 * camelCase domain ⇄ snake_case wire (and Postgres column) codec. Field stamps in
 * `fieldsUpdatedAt` are keyed by field name and renamed the same way.
 */
export function createSnakeCodec(snakeByCamel: Record<string, string>) {
  const camelBySnake = Object.fromEntries(
    Object.entries(snakeByCamel).map(([camel, snake]) => [snake, camel]),
  );
  const toSnake = (key: string): string => snakeByCamel[key] ?? key;
  const toCamel = (key: string): string => camelBySnake[key] ?? key;
  const rename = <T>(source: Record<string, T>, fn: (key: string) => string): Record<string, T> =>
    Object.fromEntries(Object.entries(source).map(([key, value]) => [fn(key), value]));

  return {
    toWire<D extends { fieldsUpdatedAt: Record<string, string> }>(
      domain: D,
      serverUpdatedAt: string | null,
    ): Record<string, unknown> {
      const { fieldsUpdatedAt, ...rest } = domain;
      return {
        ...rename(rest as Record<string, unknown>, toSnake),
        fields_updated_at: rename(fieldsUpdatedAt, toSnake),
        server_updated_at: serverUpdatedAt,
      };
    },
    fromWire(wire: Record<string, unknown>): Record<string, unknown> {
      const { fields_updated_at, server_updated_at, ...rest } = wire;
      void server_updated_at;
      return {
        ...rename(rest, toCamel),
        fieldsUpdatedAt: rename((fields_updated_at ?? {}) as Record<string, string>, toCamel),
      };
    },
  };
}
