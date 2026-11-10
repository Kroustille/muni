import { type Kysely, sql } from "kysely";

/** 015 Souvenirs & progression: souvenir, goal, goal_checkin, achievement. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("souvenir")
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("occurred_on", "date", (col) => col.notNull())
    .addColumn("body", "text")
    .addColumn("mood", "varchar(32)")
    .addColumn("place", "text")
    .addColumn("favourite", "boolean", (col) => col.notNull())
    .addColumn("links", "jsonb", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("souvenir_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "souvenir_title_length",
      sql`char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 200`,
    )
    .execute();
  await db.schema
    .createIndex("souvenir_user_server_updated_at_idx")
    .on("souvenir")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("goal")
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("period_kind", "varchar(16)", (col) => col.notNull())
    .addColumn("start_date", "date", (col) => col.notNull())
    .addColumn("end_date", "date", (col) => col.notNull())
    .addColumn("target_kind", "varchar(16)", (col) => col.notNull())
    .addColumn("metric", "varchar(32)")
    .addColumn("target_count", "integer")
    .addColumn("status", "varchar(16)", (col) => col.notNull())
    .addColumn("reflection", "text")
    .addColumn("reflection_prompt_dismissed_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("goal_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "goal_title_length",
      sql`char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 200`,
    )
    .addCheckConstraint("goal_period", sql`start_date <= end_date`)
    .addCheckConstraint(
      "goal_period_kind",
      sql`period_kind IN ('week', 'month', 'quarter', 'year', 'custom')`,
    )
    .addCheckConstraint(
      "goal_target_kind",
      sql`target_kind IN ('domain_count', 'checkin_count', 'done')`,
    )
    .addCheckConstraint("goal_status", sql`status IN ('active', 'archived')`)
    .execute();
  await db.schema
    .createIndex("goal_user_server_updated_at_idx")
    .on("goal")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("goal_checkin")
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("goal_id", "uuid", (col) => col.notNull())
    .addColumn("occurred_on", "date", (col) => col.notNull())
    .addColumn("note", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("goal_checkin_pkey", ["user_id", "id"])
    .addForeignKeyConstraint("goal_checkin_goal_fkey", ["user_id", "goal_id"], "goal", [
      "user_id",
      "id",
    ])
    .execute();
  await db.schema
    .createIndex("goal_checkin_user_server_updated_at_idx")
    .on("goal_checkin")
    .columns(["user_id", "server_updated_at"])
    .execute();
  await db.schema
    .createIndex("goal_checkin_user_goal_idx")
    .on("goal_checkin")
    .columns(["user_id", "goal_id"])
    .execute();

  await db.schema
    .createTable("achievement")
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("origin", "varchar(16)", (col) => col.notNull())
    .addColumn("rule_id", "varchar(100)")
    .addColumn("rule_version", "integer")
    .addColumn("threshold", "integer")
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("earned_on", "date", (col) => col.notNull())
    .addColumn("body", "text")
    .addColumn("links", "jsonb", (col) => col.notNull())
    .addColumn("celebrated_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("achievement_pkey", ["user_id", "id"])
    .addCheckConstraint("achievement_origin", sql`origin IN ('auto', 'manual')`)
    .addCheckConstraint(
      "achievement_auto_rule",
      sql`origin <> 'auto' OR (rule_id IS NOT NULL AND threshold IS NOT NULL)`,
    )
    .execute();
  await db.schema
    .createIndex("achievement_user_server_updated_at_idx")
    .on("achievement")
    .columns(["user_id", "server_updated_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("achievement").execute();
  await db.schema.dropTable("goal_checkin").execute();
  await db.schema.dropTable("goal").execute();
  await db.schema.dropTable("souvenir").execute();
}
