import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("music_composition")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("started_at", "date")
    .addColumn("finished_at", "date")
    .addColumn("last_worked_at", "date")
    .addColumn("genre_style", "text")
    .addColumn("tempo_bpm", "integer")
    .addColumn("mood", "text")
    .addColumn("notes", "text")
    .addColumn("external_url", "text")
    .addColumn("session_notes", "jsonb", (col) => col.notNull())
    .addColumn("linked_track_ids", sql`uuid[]`)
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("music_composition_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "music_composition_status",
      sql`status IN ('idea', 'in_progress', 'paused', 'finished', 'archived')`,
    )
    .addCheckConstraint(
      "music_composition_title_nonempty",
      sql`char_length(btrim(title)) > 0 AND char_length(btrim(title)) <= 500`,
    )
    .execute();

  await db.schema
    .createIndex("music_composition_user_server_updated_at_idx")
    .on("music_composition")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("dj_set")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("performed_at", "date")
    .addColumn("venue", "text")
    .addColumn("duration_minutes", "integer")
    .addColumn("genre_style", "text")
    .addColumn("bpm_range", "text")
    .addColumn("mood", "text")
    .addColumn("notes", "text")
    .addColumn("setlist", "jsonb", (col) => col.notNull())
    .addColumn("external_url", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("dj_set_pkey", ["user_id", "id"])
    .addCheckConstraint("dj_set_status", sql`status IN ('planned', 'performed', 'cancelled')`)
    .addCheckConstraint(
      "dj_set_title_nonempty",
      sql`char_length(btrim(title)) > 0 AND char_length(btrim(title)) <= 500`,
    )
    .execute();

  await db.schema
    .createIndex("dj_set_user_server_updated_at_idx")
    .on("dj_set")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("practice_instrument")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("notes", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("practice_instrument_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "practice_instrument_name_nonempty",
      sql`char_length(btrim(name)) > 0 AND char_length(btrim(name)) <= 200`,
    )
    .execute();

  await db.schema
    .createIndex("practice_instrument_user_server_updated_at_idx")
    .on("practice_instrument")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("practice_exercise")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("instrument_id", "uuid")
    .addColumn("category", "text")
    .addColumn("notes", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("practice_exercise_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "practice_exercise_title_nonempty",
      sql`char_length(btrim(title)) > 0 AND char_length(btrim(title)) <= 500`,
    )
    .execute();

  await db.schema
    .createIndex("practice_exercise_user_server_updated_at_idx")
    .on("practice_exercise")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("practice_plan")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("is_active", "boolean", (col) => col.notNull())
    .addColumn("assignments", "jsonb", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("practice_plan_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "practice_plan_name_nonempty",
      sql`char_length(btrim(name)) > 0 AND char_length(btrim(name)) <= 300`,
    )
    .execute();

  await db.schema
    .createIndex("practice_plan_user_server_updated_at_idx")
    .on("practice_plan")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("practice_log")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("practiced_at", "date", (col) => col.notNull())
    .addColumn("practice_kind", "varchar(32)", (col) => col.notNull())
    .addColumn("instrument_id", "uuid")
    .addColumn("exercise_ids", sql`uuid[]`, (col) => col.notNull())
    .addColumn("learning_piece_id", "uuid")
    .addColumn("duration_minutes", "integer")
    .addColumn("notes", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("practice_log_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "practice_log_practice_kind",
      sql`practice_kind IN ('structured', 'improvisation')`,
    )
    .execute();

  await db.schema
    .createIndex("practice_log_user_server_updated_at_idx")
    .on("practice_log")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("learning_piece")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("instrument_id", "uuid")
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("linked_track_id", "uuid")
    .addColumn("started_at", "date")
    .addColumn("last_practiced_at", "date")
    .addColumn("notes", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("learning_piece_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "learning_piece_status",
      sql`status IN ('learning', 'comfortable', 'paused', 'archived')`,
    )
    .addCheckConstraint(
      "learning_piece_title_nonempty",
      sql`char_length(btrim(title)) > 0 AND char_length(btrim(title)) <= 500`,
    )
    .execute();

  await db.schema
    .createIndex("learning_piece_user_server_updated_at_idx")
    .on("learning_piece")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("learning_piece").execute();
  await db.schema.dropTable("practice_log").execute();
  await db.schema.dropTable("practice_plan").execute();
  await db.schema.dropTable("practice_exercise").execute();
  await db.schema.dropTable("practice_instrument").execute();
  await db.schema.dropTable("dj_set").execute();
  await db.schema.dropTable("music_composition").execute();
}
