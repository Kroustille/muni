import type { Migration, MigrationProvider } from "kysely/migration";

// Static registry: add each migration module here, keyed by its sortable name.
const migrations: Record<string, Migration> = {};

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
