import type { Kysely, Selectable } from "kysely";

import type { Session, SessionRepository } from "../../application/ports/session-repository";
import type { DB, Sessions } from "./db-types";

function toSession(row: Selectable<Sessions>): Session {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    lastSeenAt: new Date(row.last_seen_at),
  };
}

export function createPostgresSessionRepository(db: Kysely<DB>): SessionRepository {
  return {
    async create(session) {
      await db
        .insertInto("sessions")
        .values({
          id: session.id,
          user_id: session.userId,
          token_hash: session.tokenHash,
          created_at: session.createdAt,
          expires_at: session.expiresAt,
          last_seen_at: session.lastSeenAt,
        })
        .execute();
    },

    async findByTokenHash(tokenHash) {
      const row = await db
        .selectFrom("sessions")
        .selectAll()
        .where("token_hash", "=", tokenHash)
        .executeTakeFirst();
      return row ? toSession(row) : null;
    },

    async touch(tokenHash, lastSeenAt, expiresAt) {
      await db
        .updateTable("sessions")
        .set({ last_seen_at: lastSeenAt, expires_at: expiresAt })
        .where("token_hash", "=", tokenHash)
        .execute();
    },

    async deleteByTokenHash(tokenHash) {
      await db.deleteFrom("sessions").where("token_hash", "=", tokenHash).execute();
    },
  };
}
