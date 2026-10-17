/**
 * Status enums for migration CHECK constraints.
 * Must match `BOOK_STATUSES` / `MOVIE_STATUSES` in `src/domain/item-*.ts`
 * (guarded by `tests/unit/migration-item-type-fields-check.test.ts`).
 */
export const MIGRATION_BOOK_STATUSES = ["to_read", "reading", "read", "paused"] as const;
export const MIGRATION_MOVIE_STATUSES = [
  "to_watch",
  "in_progress",
  "paused",
  "watched",
] as const;

/** SQL fragment for `status IN (...)` used in Postgres `items_type_fields` CHECK constraints. */
export function migrationStatusInList(statuses: readonly string[]): string {
  return statuses.map((status) => `'${status}'`).join(", ");
}

/** Book branch: `(status IS NULL OR status IN (...))` — keep in sync with latest migration. */
export function migrationBookStatusCheckSql(): string {
  return `(status IS NULL OR status IN (${migrationStatusInList(MIGRATION_BOOK_STATUSES)}))`;
}

/** Movie branch: `(status IS NULL OR status IN (...))` — keep in sync with latest migration. */
export function migrationMovieStatusCheckSql(): string {
  return `(status IS NULL OR status IN (${migrationStatusInList(MIGRATION_MOVIE_STATUSES)}))`;
}
