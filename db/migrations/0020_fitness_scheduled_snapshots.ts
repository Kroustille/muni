import { type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("fitness_scheduled_session")
    .addColumn("title_snapshot", "text")
    .addColumn("template_exercises_snapshot", "jsonb")
    .execute();

  await db.schema.alterTable("fitness_skip_record").addColumn("title_snapshot", "text").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("fitness_skip_record").dropColumn("title_snapshot").execute();
  await db.schema
    .alterTable("fitness_scheduled_session")
    .dropColumn("template_exercises_snapshot")
    .dropColumn("title_snapshot")
    .execute();
}
