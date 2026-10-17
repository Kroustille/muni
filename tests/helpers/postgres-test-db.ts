import { randomUUID } from "node:crypto";
import { Kysely, PostgresDialect } from "kysely";
import { Migrator } from "kysely/migration";
import { Pool } from "pg";
import { migrationProvider } from "../../db/migrations";

const DEFAULT_TEST_DATABASE_URL = "postgres://muni:muni@localhost:5432/muni_test";

/** Vitest runs files in parallel; concurrent Kysely migrators race on lock DDL. */
let migrationChain: Promise<unknown> = Promise.resolve();

function migrateToLatestSerialized(db: Kysely<unknown>): Promise<{ error?: unknown }> {
  const run = migrationChain.then(() =>
    new Migrator({ db, provider: migrationProvider }).migrateToLatest(),
  );
  migrationChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export interface TestDatabase {
  // Untyped on purpose: the generated db-types.ts belongs to the adapters under test.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: Kysely<any>;
  schema: string;
  destroy(): Promise<void>;
}

/**
 * Creates a fresh PostgreSQL schema in the Compose test database (TEST_DATABASE_URL),
 * runs every migration inside it and returns a Kysely instance bound to it
 * through `search_path`. `destroy()` drops the schema.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const connectionString = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  const schema = `test_${randomUUID().replaceAll("-", "")}`;

  const adminPool = new Pool({ connectionString, max: 1 });
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  await adminPool.end();

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString, max: 20, options: `-c search_path=${schema}` }),
    }),
  });

  const { error } = await migrateToLatestSerialized(db);
  if (error) {
    await dropSchema(db, connectionString, schema);
    throw error;
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: db as Kysely<any>,
    schema,
    destroy: () => dropSchema(db, connectionString, schema),
  };
}

async function dropSchema(
  db: Kysely<unknown>,
  connectionString: string,
  schema: string,
): Promise<void> {
  await db.destroy();
  const adminPool = new Pool({ connectionString, max: 1 });
  try {
    await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await adminPool.end();
  }
}
