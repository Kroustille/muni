import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("google_sub", "text", (col) => col.unique())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint("users_email_lowercase", sql`email = lower(email)`)
    .execute();

  await db.schema
    .createTable("sessions")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("token_hash", "text", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("last_seen_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex("sessions_user_id_idx").on("sessions").column("user_id").execute();

  await db.schema
    .createTable("magic_link_tokens")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("token_hash", "text", (col) => col.notNull().unique())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("consumed_at", "timestamptz")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("magic_link_tokens").execute();
  await db.schema.dropTable("sessions").execute();
  await db.schema.dropTable("users").execute();
}
