import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("fitness_user_settings")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("charge_unit", "varchar(8)", (col) => col.notNull())
    .addColumn("adherence_tracking_enabled", "boolean", (col) => col.notNull())
    .addColumn("adherence_min_workouts_per_week", "smallint", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("fitness_user_settings_pkey", ["user_id", "id"])
    .addCheckConstraint("fitness_user_settings_charge_unit", sql`charge_unit IN ('kg', 'lb')`)
    .execute();

  await db.schema
    .createIndex("fitness_user_settings_user_server_updated_at_idx")
    .on("fitness_user_settings")
    .columns(["user_id", "server_updated_at"])
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
    .addCheckConstraint(
      "fitness_program_name_nonempty",
      sql`char_length(btrim(name)) > 0 AND char_length(btrim(name)) <= 200`,
    )
    .execute();

  await db.schema
    .createIndex("fitness_program_user_server_updated_at_idx")
    .on("fitness_program")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("fitness_workout_log")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("calendar_date", "date", (col) => col.notNull())
    .addColumn("planned_session_id", "uuid")
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("started_at", "timestamptz", (col) => col.notNull())
    .addColumn("completed_at", "timestamptz")
    .addColumn("catalog_version", "integer", (col) => col.notNull())
    .addColumn("logged_exercises", "jsonb", (col) => col.notNull())
    .addColumn("recovery", "jsonb")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("fitness_workout_log_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "fitness_workout_log_status",
      sql`status IN ('in_progress', 'completed', 'abandoned')`,
    )
    .execute();

  await db.schema
    .createIndex("fitness_workout_log_user_server_updated_at_idx")
    .on("fitness_workout_log")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("fitness_skip_record")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("calendar_date", "date", (col) => col.notNull())
    .addColumn("planned_session_id", "uuid", (col) => col.notNull())
    .addColumn("note", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("fitness_skip_record_pkey", ["user_id", "id"])
    .execute();

  await db.schema
    .createIndex("fitness_skip_record_user_server_updated_at_idx")
    .on("fitness_skip_record")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("fitness_skip_record").execute();
  await db.schema.dropTable("fitness_workout_log").execute();
  await db.schema.dropTable("fitness_program").execute();
  await db.schema.dropTable("fitness_user_settings").execute();
}
