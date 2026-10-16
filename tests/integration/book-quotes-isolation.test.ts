import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createPostgresBookQuoteRepository } from "@/adapters/postgres/book-quote-repository";
import { createPostgresItemRepository } from "@/adapters/postgres/item-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import { createBookQuoteSyncService } from "@/application/server/book-quote-sync-service";
import { bookQuoteToWire, newBookQuote } from "@/domain/book-quote";
import { makeServerItemWire } from "../helpers/server-item-wire";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");
const BOOK_A = "30000000-0000-4000-8000-000000000001";
const BOOK_B = "30000000-0000-4000-8000-000000000002";
const QUOTE_A = "40000000-0000-4000-8000-000000000001";
const QUOTE_B = "40000000-0000-4000-8000-000000000002";

let testDb: TestDatabase | undefined;
let userA: string;
let userB: string;
let idCounter = 0;

const uniqueUserId = (): string =>
  `10000000-0000-4000-8000-${String((idCounter += 1)).padStart(12, "0")}`;

describe("book quote sync isolation", () => {
  beforeAll(async () => {
    testDb = await createTestDatabase();
    const users = createPostgresUserRepository(testDb.db);
    userA = (
      await users.create({
        id: uniqueUserId(),
        email: "quotes-a@test.local",
        googleSub: null,
        createdAt: NOW,
      })
    ).id;
    userB = (
      await users.create({
        id: uniqueUserId(),
        email: "quotes-b@test.local",
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
    await testDb.db.deleteFrom("book_quotes").execute();
    await testDb.db.deleteFrom("items").execute();
  });

  it("never returns another user's quotes on pull", async () => {
    if (testDb === undefined) return;
    const items = createPostgresItemRepository(testDb.db);
    const quotes = createPostgresBookQuoteRepository(testDb.db);
    const sync = createBookQuoteSyncService({ quotes, items, now: () => NOW });

    const bookWire = makeServerItemWire({
      id: BOOK_A,
      item: { type: "book", title: "Livre A" },
      serverUpdatedAt: NOW.toISOString(),
    });
    await items.transaction(async (repo) => {
      await repo.upsert(userA, [bookWire]);
      await repo.upsert(userB, [
        makeServerItemWire({
          id: BOOK_B,
          item: { type: "book", title: "Livre B" },
          serverUpdatedAt: NOW.toISOString(),
        }),
      ]);
    });

    const quote = newBookQuote({
      id: QUOTE_A,
      bookItemId: BOOK_A,
      text: "Citation A",
      createdAt: NOW.toISOString(),
    });
    await sync.push(userA, [bookQuoteToWire(quote)]);

    const quoteB = newBookQuote({
      id: QUOTE_B,
      bookItemId: BOOK_B,
      text: "Citation B",
      createdAt: NOW.toISOString(),
    });
    await sync.push(userB, [bookQuoteToWire(quoteB)]);

    const pullA = await sync.pull(userA, null, 100);
    const pullB = await sync.pull(userB, null, 100);

    expect(pullA.quotes.map((row) => row.id)).toEqual([QUOTE_A]);
    expect(pullB.quotes.map((row) => row.id)).toEqual([QUOTE_B]);
  });
});
