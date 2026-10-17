import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BOOK_STATUSES } from "@/domain/item-book";
import { MOVIE_STATUSES } from "@/domain/item-movie";
import {
  migrationBookStatusCheckSql,
  migrationMovieStatusCheckSql,
  migrationStatusInList,
} from "../../db/migrations/shared/item-type-status-sql";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations");
const latestItemsMigration = readFileSync(
  join(migrationsDir, "0011_movie_library_fields.ts"),
  "utf8",
);

function statusesFromInClause(clause: string): Set<string> {
  return new Set([...clause.matchAll(/'([^']+)'/g)].map((match) => match[1]));
}

function statusInClausesFromMigration(sql: string): Set<string>[] {
  return [...sql.matchAll(/status IS NULL OR status IN \(([^)]+)\)/g)].map((match) =>
    statusesFromInClause(match[1]),
  );
}

function migrationCoversStatuses(sql: string, statuses: readonly string[]): boolean {
  const needed = new Set(statuses);
  return statusInClausesFromMigration(sql).some((clause) =>
    [...needed].every((status) => clause.has(status)),
  );
}

describe("ITEM_TYPE_FIELDS_CHECK status enums", () => {
  it("documents book statuses aligned with domain", () => {
    expect(migrationStatusInList([...BOOK_STATUSES])).toBe(
      "'to_read', 'reading', 'read', 'paused'",
    );
    expect(BOOK_STATUSES).toEqual(["to_read", "reading", "read", "paused"]);
    expect(migrationBookStatusCheckSql()).toContain("'to_read'");
  });

  it("documents movie statuses aligned with domain", () => {
    expect(migrationStatusInList(MOVIE_STATUSES)).toBe(
      "'to_watch', 'in_progress', 'paused', 'watched'",
    );
    expect(MOVIE_STATUSES).toEqual(["to_watch", "in_progress", "paused", "watched"]);
    expect(migrationMovieStatusCheckSql()).toContain("'in_progress'");
  });

  it("latest items migration CHECK includes full book and movie status sets", () => {
    expect(migrationCoversStatuses(latestItemsMigration, BOOK_STATUSES)).toBe(true);
    expect(migrationCoversStatuses(latestItemsMigration, MOVIE_STATUSES)).toBe(true);
  });

  it("latest items migration CHECK has valid CASE branch SQL (no glued tokens)", () => {
    expect(latestItemsMigration).not.toMatch(/THEN\n        AND /);
    expect(latestItemsMigration).not.toMatch(/\)[ \t]*WHEN '/);
  });

  it("quotes reserved column name cast in CHECK SQL", () => {
    expect(latestItemsMigration).not.toMatch(/\bcast IS NULL/);
    expect(latestItemsMigration).toMatch(/"cast" IS NULL/);
  });
});
