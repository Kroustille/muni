import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("plant")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("location_tag", "varchar(16)", (col) => col.notNull())
    .addColumn("notes", "text")
    .addColumn("care_profile_id", "uuid")
    .addColumn("seasonal_hints", "jsonb", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("plant_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "plant_title_length",
      sql`char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 500`,
    )
    .addCheckConstraint(
      "plant_location_tag",
      sql`location_tag IN ('indoor', 'outdoor', 'both')`,
    )
    .execute();

  await db.schema
    .createIndex("plant_user_server_updated_at_idx")
    .on("plant")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("plant_care_event")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("plant_id", "uuid", (col) => col.notNull())
    .addColumn("event_type", "varchar(16)", (col) => col.notNull())
    .addColumn("occurred_at", "date", (col) => col.notNull())
    .addColumn("notes", "text")
    .addColumn("seasonal_hint_id", "uuid")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("plant_care_event_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "plant_care_event_type",
      sql`event_type IN ('water', 'fertilize', 'repot', 'prune', 'mist', 'other')`,
    )
    .execute();

  await db.schema
    .createIndex("plant_care_event_user_server_updated_at_idx")
    .on("plant_care_event")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createIndex("plant_care_event_plant_occurred_idx")
    .on("plant_care_event")
    .columns(["user_id", "plant_id", "occurred_at"])
    .execute();

  await db.schema
    .createTable("plant_care_profile")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("seasonal_hints", "jsonb", (col) => col.notNull())
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("plant_care_profile_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "plant_care_profile_title_length",
      sql`char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 300`,
    )
    .execute();

  await db.schema
    .createIndex("plant_care_profile_user_server_updated_at_idx")
    .on("plant_care_profile")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("vegetable_culture")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("location_note", "text")
    .addColumn("variety", "text")
    .addColumn("notes", "text")
    .addColumn("plant_id", "uuid")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("vegetable_culture_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "vegetable_culture_title_length",
      sql`char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 500`,
    )
    .execute();

  await db.schema
    .createIndex("vegetable_culture_user_server_updated_at_idx")
    .on("vegetable_culture")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createTable("vegetable_milestone")
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("id", "uuid", (col) => col.notNull())
    .addColumn("culture_id", "uuid", (col) => col.notNull())
    .addColumn("milestone_type", "varchar(16)", (col) => col.notNull())
    .addColumn("occurred_at", "date", (col) => col.notNull())
    .addColumn("notes", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("fields_updated_at", "jsonb", (col) => col.notNull())
    .addColumn("server_updated_at", "timestamptz", (col) => col.notNull())
    .addPrimaryKeyConstraint("vegetable_milestone_pkey", ["user_id", "id"])
    .addCheckConstraint(
      "vegetable_milestone_type",
      sql`milestone_type IN ('sow', 'transplant', 'thin', 'harvest')`,
    )
    .execute();

  await db.schema
    .createIndex("vegetable_milestone_user_server_updated_at_idx")
    .on("vegetable_milestone")
    .columns(["user_id", "server_updated_at"])
    .execute();

  await db.schema
    .createIndex("vegetable_milestone_culture_occurred_idx")
    .on("vegetable_milestone")
    .columns(["user_id", "culture_id", "milestone_type", "occurred_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("vegetable_milestone").execute();
  await db.schema.dropTable("vegetable_culture").execute();
  await db.schema.dropTable("plant_care_profile").execute();
  await db.schema.dropTable("plant_care_event").execute();
  await db.schema.dropTable("plant").execute();
}
