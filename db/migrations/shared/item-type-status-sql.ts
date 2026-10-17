import { BOOK_STATUSES } from "@/domain/item-book";
import { MOVIE_STATUSES } from "@/domain/item-movie";

/** SQL fragment for `status IN (...)` used in Postgres `items_type_fields` CHECK constraints. */
export function migrationStatusInList(statuses: readonly string[]): string {
  return statuses.map((status) => `'${status}'`).join(", ");
}

/** Book branch: `(status IS NULL OR status IN (...))` — keep in sync with latest migration. */
export function migrationBookStatusCheckSql(): string {
  return `(status IS NULL OR status IN (${migrationStatusInList(BOOK_STATUSES)}))`;
}

/** Movie branch: `(status IS NULL OR status IN (...))` — keep in sync with latest migration. */
export function migrationMovieStatusCheckSql(): string {
  return `(status IS NULL OR status IN (${migrationStatusInList(MOVIE_STATUSES)}))`;
}
