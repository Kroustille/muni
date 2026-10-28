import { type Kysely, sql } from "kysely";

/** Break-fast session-first: drop weekly program; new template + schedule tables. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("fitness_program").ifExists().execute();

  await sql`TRUNCATE fitness_skip_record, fitness_workout_log`.execute(db);

  await db.schema
    .alterTable("fitness_workout_log")
    .dropColumn("planned_session_id")
    .execute();

  await db.schema
    .alterTable("fitness_workout_log")
    .addColumn("session_template_id", "uuid")
    .addColumn("scheduled_session_id", "uuid")
    .execute();

  await db.schema
    .alterTable("fitness_skip_record")
    .dropColumn("planned_session_id")
    .execute();

  await db.schema
    .alterTable("fitness_skip_record")
    .addColumn("scheduled_session_id", "uuid", (col) => col.notNull())
    .addColumn("session_template_id", "uuid")
    .execute();

  await db.schema
    .createTable("fitness_session_template")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("sort_order", "double precision", (col) => col.notNull())
    .addColumn("template_exercises", "jsonb", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("fitness_session_template_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "fitness_session_template_title_nonempty",
      sql`char_length(btrim(title)) > 0 AND char_length(btrim(title)) <= 200`,
    )
    .execute();

  await db.schema
    .createIndex("fitness_session_template_user_server_updated_at_idx")
    .on("fitness_session_template")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("fitness_scheduled_session")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("calendar_date", "date", (col) => col.notNull())
    .addColumn("session_template_id", "uuid", (col) => col.notNull())
    .addColumn("sort_order", "double precision", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("fitness_scheduled_session_pkey", ["user_id", "id"])
    .execute();

  await db.schema
    .createIndex("fitness_scheduled_session_user_server_updated_at_idx")
    .on("fitness_scheduled_session")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createIndex("fitness_scheduled_session_user_date_idx")
    .on("fitness_scheduled_session")
    .columns(["user_id", "calendar_date"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("fitness_scheduled_session").execute();
  await db.schema.dropTable("fitness_session_template").execute();
  await sql`TRUNCATE fitness_skip_record, fitness_workout_log`.execute(db);
  await db.schema.alterTable("fitness_skip_record").dropColumn("scheduled_session_id").execute();
  await db.schema.alterTable("fitness_skip_record").dropColumn("session_template_id").execute();
  await db.schema
    .alterTable("fitness_skip_record")
    .addColumn("planned_session_id", "uuid", (col) => col.notNull())
    .execute();
  await db.schema.alterTable("fitness_workout_log").dropColumn("session_template_id").execute();
  await db.schema.alterTable("fitness_workout_log").dropColumn("scheduled_session_id").execute();
  await db.schema
    .alterTable("fitness_workout_log")
    .addColumn("planned_session_id", "uuid")
    .execute();
  await db.schema
    .createTable("fitness_program")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("is_active", "boolean", (col) => col.notNull())
    .addColumn("planned_sessions", "jsonb", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("fitness_program_pkey", ["user_id", "id"])
    .execute();
}
