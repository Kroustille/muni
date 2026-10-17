import type { Kysely } from "kysely";

import type { WatchGoalRepository } from "@/application/ports/watch-goal-repository";
import type { WatchGoal } from "@/domain/watch-goal";
import type { DB } from "./db-types";
import { createPostgresAnnualGoalRepository } from "./annual-goal-repository";

export function createPostgresWatchGoalRepository(
  db: Kysely<DB>,
  userId: string,
): WatchGoalRepository {
  return createPostgresAnnualGoalRepository<WatchGoal>(db, userId, "watch_goals");
}
