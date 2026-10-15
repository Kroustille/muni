import type { Migration, MigrationProvider } from "kysely/migration";

import * as m0001Auth from "./0001_auth";
import * as m0002Items from "./0002_items";
import * as m0003BookCatalogFields from "./0003_book_catalog_fields";
import * as m0004CatalogCache from "./0004_catalog_cache";

// Static registry: add each migration module here, keyed by its sortable name.
const migrations: Record<string, Migration> = {
  "0001_auth": m0001Auth,
  "0002_items": m0002Items,
  "0003_book_catalog_fields": m0003BookCatalogFields,
  "0004_catalog_cache": m0004CatalogCache,
};

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
