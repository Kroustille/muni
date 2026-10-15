import type { Kysely, Selectable } from "kysely";

import type { User, UserRepository } from "../../application/ports/user-repository";
import type { DB, Users } from "./db-types";

function toUser(row: Selectable<Users>): User {
  return {
    id: row.id,
    email: row.email,
    googleSub: row.google_sub,
    createdAt: new Date(row.created_at),
  };
}

export function createPostgresUserRepository(db: Kysely<DB>): UserRepository {
  return {
    async findById(id) {
      const row = await db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst();
      return row ? toUser(row) : null;
    },

    async findByEmail(email) {
      const row = await db
        .selectFrom("users")
        .selectAll()
        .where("email", "=", email.toLowerCase())
        .executeTakeFirst();
      return row ? toUser(row) : null;
    },

    async findByGoogleSub(googleSub) {
      const row = await db
        .selectFrom("users")
        .selectAll()
        .where("google_sub", "=", googleSub)
        .executeTakeFirst();
      return row ? toUser(row) : null;
    },

    async create(newUser) {
      const email = newUser.email.toLowerCase();
      const row = await db
        .insertInto("users")
        .values({
          id: newUser.id,
          email,
          google_sub: newUser.googleSub,
          created_at: newUser.createdAt,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return toUser(row);
    },

    async linkGoogleSub(userId, googleSub) {
      const row = await db
        .updateTable("users")
        .set({ google_sub: googleSub })
        .where("id", "=", userId)
        .returningAll()
        .executeTakeFirst();
      if (!row) throw new Error(`Unknown user: ${userId}`);
      return toUser(row);
    },
  };
}
