import type { Kysely, Transaction } from "kysely";

import type {
  MemoriesGrowthServerRepositories,
  ServerSyncedRepository,
} from "@/application/ports/memories-growth-repositories";
import { achievementWireSchema, type AchievementWire } from "@/domain/achievement";
import {
  goalCheckinWireSchema,
  goalWireSchema,
  type GoalCheckinWire,
  type GoalWire,
} from "@/domain/goal";
import { souvenirWireSchema, type SouvenirWire } from "@/domain/souvenir";
import type { DB } from "./db-types";
import { toJsonArray, toJsonColumn } from "./json-row-utils";

/**
 * Generic Postgres repository for 015 entities. Wire keys equal column names
 * (snake_case), so rows map 1:1 apart from date/timestamp/jsonb conversions.
 */

type Row = Record<string, unknown>;
type GenericDb = Record<string, Row>;
type DbOrTrx = Kysely<GenericDb> | Transaction<GenericDb>;

type TableConfig<W> = {
  table: "souvenir" | "goal" | "goal_checkin" | "achievement";
  parse: (row: Row) => W;
  dateColumns: readonly string[];
  timestampColumns: readonly string[];
  jsonArrayColumns: readonly string[];
};

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

/** `date` columns come back as Date at UTC midnight (or a string) — keep the calendar day. */
function toCalendarDate(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(String(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function rowToWire<W>(config: TableConfig<W>, row: Row): W {
  const { user_id, ...rest } = row;
  void user_id;
  const wire: Row = { ...rest };
  for (const col of config.dateColumns) wire[col] = toCalendarDate(wire[col]);
  for (const col of config.timestampColumns) {
    if (wire[col] !== null && wire[col] !== undefined) wire[col] = toIso(wire[col]);
  }
  for (const col of config.jsonArrayColumns) wire[col] = toJsonArray(wire[col]);
  wire.fields_updated_at = (wire.fields_updated_at ?? {}) as Row;
  wire.server_updated_at = toIso(row.server_updated_at);
  return config.parse(wire);
}

function wireToRow(
  userId: string,
  wire: Row,
  serverUpdatedAt: string,
  config: TableConfig<unknown>,
): Row {
  const row: Row = { ...wire, user_id: userId, server_updated_at: serverUpdatedAt };
  for (const col of config.jsonArrayColumns) row[col] = toJsonColumn(wire[col]);
  row.fields_updated_at = toJsonColumn(wire.fields_updated_at);
  return row;
}

function createRepo<W extends { id: string; server_updated_at?: string | null }>(
  db: DbOrTrx,
  inTransaction: boolean,
  config: TableConfig<W>,
): ServerSyncedRepository<W> {
  return {
    transaction(fn) {
      if (inTransaction) return fn(createRepo(db, true, config));
      return (db as Kysely<GenericDb>)
        .transaction()
        .execute(async (trx) => fn(createRepo(trx, true, config)));
    },

    async findByIds(userId, ids) {
      if (!inTransaction) throw new Error("findByIds must run inside transaction");
      if (ids.length === 0) return [];
      const rows = await db
        .selectFrom(config.table)
        .selectAll()
        .where("user_id", "=", userId)
        .where("id", "in", ids)
        .forUpdate()
        .execute();
      return rows.map((row) => rowToWire(config, row));
    },

    async upsert(userId, wire) {
      if (!inTransaction) throw new Error("upsert must run inside transaction");
      const serverUpdatedAt = wire.server_updated_at ?? new Date().toISOString();
      const values = wireToRow(
        userId,
        wire as unknown as Row,
        serverUpdatedAt,
        config as TableConfig<unknown>,
      );
      const { user_id, id, ...updates } = values;
      void user_id;
      void id;
      await db
        .insertInto(config.table)
        .values(values)
        .onConflict((oc) => oc.columns(["user_id", "id"]).doUpdateSet(updates))
        .execute();
      return config.parse({ ...(wire as unknown as Row), server_updated_at: serverUpdatedAt });
    },

    async pullSince(userId, since, limit) {
      let query = db
        .selectFrom(config.table)
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("server_updated_at", "asc")
        .orderBy("id", "asc")
        .limit(limit);
      if (since !== null) query = query.where("server_updated_at", ">", since);
      const rows = await query.execute();
      return rows.map((row) => rowToWire(config, row));
    },
  };
}

const COMMON_TIMESTAMPS = ["created_at", "deleted_at"] as const;

const souvenirConfig: TableConfig<SouvenirWire> = {
  table: "souvenir",
  parse: (row) => souvenirWireSchema.parse(row),
  dateColumns: ["occurred_on"],
  timestampColumns: COMMON_TIMESTAMPS,
  jsonArrayColumns: ["links"],
};

const goalConfig: TableConfig<GoalWire> = {
  table: "goal",
  parse: (row) => goalWireSchema.parse(row),
  dateColumns: ["start_date", "end_date"],
  timestampColumns: [...COMMON_TIMESTAMPS, "reflection_prompt_dismissed_at"],
  jsonArrayColumns: [],
};

const goalCheckinConfig: TableConfig<GoalCheckinWire> = {
  table: "goal_checkin",
  parse: (row) => goalCheckinWireSchema.parse(row),
  dateColumns: ["occurred_on"],
  timestampColumns: COMMON_TIMESTAMPS,
  jsonArrayColumns: [],
};

const achievementConfig: TableConfig<AchievementWire> = {
  table: "achievement",
  parse: (row) => achievementWireSchema.parse(row),
  dateColumns: ["earned_on"],
  timestampColumns: [...COMMON_TIMESTAMPS, "celebrated_at"],
  jsonArrayColumns: ["links"],
};

export function createPostgresMemoriesGrowthRepositories(
  database: Kysely<DB>,
): MemoriesGrowthServerRepositories {
  const db = database as unknown as Kysely<GenericDb>;
  return {
    souvenirs: createRepo(db, false, souvenirConfig),
    goals: createRepo(db, false, goalConfig),
    goalCheckins: {
      ...createRepo(db, false, goalCheckinConfig),
      async existingGoalIds(userId, goalIds) {
        if (goalIds.length === 0) return new Set();
        const rows = await db
          .selectFrom("goal")
          .select("id")
          .where("user_id", "=", userId)
          .where("id", "in", goalIds)
          .execute();
        return new Set(rows.map((row) => String(row.id)));
      },
    },
    achievements: createRepo(db, false, achievementConfig),
  };
}
