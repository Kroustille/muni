import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "./db-types";

export interface PostgresDatabase {
  readonly db: Kysely<DB>;
  destroy(): Promise<void>;
}

/** Kysely instance backed by a `pg` connection pool. */
export function createPostgresDatabase(connectionString: string): PostgresDatabase {
  const pool = new Pool({ connectionString });
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });

  return {
    db,
    destroy: () => db.destroy(),
  };
}
