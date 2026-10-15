import type { Migration, MigrationProvider } from "kysely/migration";

import * as m0001Auth from "./0001_auth";
import * as m0002Items from "./0002_items";

// Static registry: add each migration module here, keyed by its sortable name.
const migrations: Record<string, Migration> = {
  "0001_auth": m0001Auth,
  "0002_items": m0002Items,
};

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
