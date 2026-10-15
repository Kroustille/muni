import { Kysely, PostgresDialect } from "kysely";
import { Migrator } from "kysely/migration";
import { Pool } from "pg";
import { migrationProvider } from "./migrations";

type Direction = "up" | "down";

async function run(direction: Direction): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({ pool: new Pool({ connectionString }) }),
  });
  const migrator = new Migrator({ db, provider: migrationProvider });

  try {
    const { error, results } =
      direction === "up" ? await migrator.migrateToLatest() : await migrator.migrateDown();

    for (const result of results ?? []) {
      console.log(`${result.status}: ${result.direction} ${result.migrationName}`);
    }
    if (results?.length === 0) {
      console.log("No migration to run");
    }
    if (error) {
      throw error;
    }
  } finally {
    await db.destroy();
  }
}

const direction = process.argv[2];
if (direction !== "up" && direction !== "down") {
  console.error("Usage: node dist/db/migrate.js <up|down>");
  process.exit(1);
}

run(direction).catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
