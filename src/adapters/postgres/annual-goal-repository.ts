import type { Kysely } from "kysely";

import type { DB } from "./db-types";

type AnnualGoalRow = {
  year: number;
  targetCount: number;
  fieldsUpdatedAt: Record<string, string>;
};

function rowToGoal(row: {
  year: number;
  target_count: number;
  fields_updated_at: unknown;
}): AnnualGoalRow {
  return {
    year: row.year,
    targetCount: row.target_count,
    fieldsUpdatedAt: row.fields_updated_at as Record<string, string>,
  };
}

type GoalTableName = "reading_goals" | "watch_goals";

export function createPostgresAnnualGoalRepository<TGoal extends AnnualGoalRow>(
  db: Kysely<DB>,
  userId: string,
  table: GoalTableName,
): {
  get(year: number): Promise<TGoal | undefined>;
  list(): Promise<TGoal[]>;
  put(goal: TGoal): Promise<void>;
} {
  return {
    async get(year) {
      const row = await db
        .selectFrom(table)
        .selectAll()
        .where("user_id", "=", userId)
        .where("year", "=", year)
        .executeTakeFirst();
      return row === undefined ? undefined : (rowToGoal(row) as TGoal);
    },
    async list() {
      const rows = await db.selectFrom(table).selectAll().where("user_id", "=", userId).execute();
      return rows.map((row) => rowToGoal(row) as TGoal);
    },
    async put(goal) {
      const now = new Date();
      await db
        .insertInto(table)
        .values({
          user_id: userId,
          year: goal.year,
          target_count: goal.targetCount,
          fields_updated_at: goal.fieldsUpdatedAt,
          server_updated_at: now,
        })
        .onConflict((oc) =>
          oc.columns(["user_id", "year"]).doUpdateSet({
            target_count: goal.targetCount,
            fields_updated_at: goal.fieldsUpdatedAt,
            server_updated_at: now,
          }),
        )
        .execute();
    },
  };
}
