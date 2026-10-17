import type { Kysely } from "kysely";

import type { ReadingGoalRepository } from "@/application/ports/reading-goal-repository";
import type { ReadingGoal } from "@/domain/reading-goal";
import type { DB } from "./db-types";
import { createPostgresAnnualGoalRepository } from "./annual-goal-repository";

export function createPostgresReadingGoalRepository(
  db: Kysely<DB>,
  userId: string,
): ReadingGoalRepository {
  return createPostgresAnnualGoalRepository<ReadingGoal>(db, userId, "reading_goals");
}
