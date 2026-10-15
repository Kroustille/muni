import type { Migration, MigrationProvider } from "kysely/migration";

import * as m0001Auth from "./0001_auth";

// Static registry: add each migration module here, keyed by its sortable name.
const migrations: Record<string, Migration> = {
  "0001_auth": m0001Auth,
};

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
