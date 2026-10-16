import type { Kysely } from "kysely";

import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";
import type { DB } from "./db-types";

function rowToGoal(row: {
  year: number;
  target_count: number;
  fields_updated_at: unknown;
}): ReadingGoal {
  return {
    year: row.year,
    targetCount: row.target_count,
    fieldsUpdatedAt: row.fields_updated_at as Record<string, string>,
  };
}

export function createPostgresReadingGoalRepository(
  db: Kysely<DB>,
  userId: string,
): ReadingGoalRepository {
  return {
    async get(year) {
      const row = await db
        .selectFrom("reading_goals")
        .selectAll()
        .where("user_id", "=", userId)
        .where("year", "=", year)
        .executeTakeFirst();
      return row === undefined ? undefined : rowToGoal(row);
    },
    async list() {
      const rows = await db
        .selectFrom("reading_goals")
        .selectAll()
        .where("user_id", "=", userId)
        .execute();
      return rows.map(rowToGoal);
    },
    async put(goal) {
      const now = new Date();
      await db
        .insertInto("reading_goals")
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
