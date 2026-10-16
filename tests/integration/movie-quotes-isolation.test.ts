import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createPostgresMovieQuoteRepository } from "@/adapters/postgres/movie-quote-repository";
import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { createMovieQuoteSyncService } from "@/application/server/movie-quote-sync-service";
import { movieQuoteToWire, newMovieQuote } from "@/domain/movie-quote";
import { makeServerItemWire } from "../helpers/server-item-wire";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");
const MOVIE_A = "30000000-0000-4000-8000-000000000001";
const MOVIE_B = "30000000-0000-4000-8000-000000000002";
const QUOTE_A = "40000000-0000-4000-8000-000000000001";
const QUOTE_B = "40000000-0000-4000-8000-000000000002";

let testDb: TestDatabase | undefined;
let userA: string;
let userB: string;
let idCounter = 0;

const uniqueUserId = (): string =>
  `10000000-0000-4000-8000-${String((idCounter += 1)).padStart(12, "0")}`;

describe("movie quote sync isolation", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userA = (
      await users.create({
        id: uniqueUserId(),
        email: "movie-quotes-a@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    userB = (
      await users.create({
        id: uniqueUserId(),
        email: "movie-quotes-b@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
  });

  afterAll(async () => {
    await testDb?.destroy();
  });

  beforeEach(async () => {
    if (testDb === undefined) return;
    await testDb.db.deleteFrom("movie_quotes").execute();
    await testDb.db.deleteFrom("items").execute();
  });

  it("never returns another user's quotes on pull", async () => {
    if (testDb === undefined) return;
    const items = createPostgresItemRepository(testDb.db);
    const quotes = createPostgresMovieQuoteRepository(testDb.db);
    const sync = createMovieQuoteSyncService({ quotes, items, now: () => NOW });

    const movieWire = makeServerItemWire({
      id: MOVIE_A,
      item: { type: "movie", title: "Film A" },
      serverUpdatedAt: NOW.toISOString(),
    });
    await items.transaction(async (repo) => {
      await repo.upsert(userA, [movieWire]);
      await repo.upsert(userB, [
        makeServerItemWire({
          id: MOVIE_B,
          item: { type: "movie", title: "Film B" },
          serverUpdatedAt: NOW.toISOString(),
        }),
      ]);
    });

    const quote = newMovieQuote({
      id: QUOTE_A,
      movieItemId: MOVIE_A,
      text: "Citation A",
      createdAt: NOW.toISOString(),
    });
    await sync.push(userA, [movieQuoteToWire(quote)]);

    const quoteB = newMovieQuote({
      id: QUOTE_B,
      movieItemId: MOVIE_B,
      text: "Citation B",
      createdAt: NOW.toISOString(),
    });
    await sync.push(userB, [movieQuoteToWire(quoteB)]);

    const pullA = await sync.pull(userA, null, 100);
    const pullB = await sync.pull(userB, null, 100);

    expect(pullA.quotes.map((row) => row.id)).toEqual([QUOTE_A]);
    expect(pullB.quotes.map((row) => row.id)).toEqual([QUOTE_B]);
  });
});
