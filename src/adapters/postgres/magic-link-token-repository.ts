import type { Kysely } from "kysely";

import type { MagicLinkTokenRepository } from "../../application/ports/magic-link-token-repository";
import type { DB } from "./db-types";

export function createPostgresMagicLinkTokenRepository(
  db: Kysely<DB>,
): MagicLinkTokenRepository {
  return {
    async create(token) {
      await db
        .insertInto("magic_link_tokens")
        .values({
          id: token.id,
          email: token.email,
          token_hash: token.tokenHash,
          expires_at: token.expiresAt,
          consumed_at: token.consumedAt,
        })
        .execute();
    },

    async consume(tokenHash, now) {
      return await db.transaction().execute(async (trx) => {
        const row = await trx
          .selectFrom("magic_link_tokens")
          .selectAll()
          .where("token_hash", "=", tokenHash)
          .forUpdate()
          .executeTakeFirst();

        if (!row || row.consumed_at !== null || new Date(row.expires_at).getTime() <= now.getTime()) {
          return null;
        }

        await trx
          .updateTable("magic_link_tokens")
          .set({ consumed_at: now })
          .where("token_hash", "=", tokenHash)
          .execute();

        return { email: row.email };
      });
    },
  };
}
