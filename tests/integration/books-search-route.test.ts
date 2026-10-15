import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGoogleUseCases } from "@/application/auth/google";
import { createMagicLinkUseCases } from "@/application/auth/magic-link";
import { createSessionUseCases } from "@/application/auth/sessions";
import type { SearchBooks } from "@/application/books/search-books";
import { CatalogLookupError } from "@/application/ports/book-catalog-lookup";
import { createInMemoryAuth, type InMemoryAuth } from "../helpers/in-memory-auth";
import { SESSION_COOKIE_NAME } from "@/app/api/_lib/auth-cookies";

const APP_URL = "http://localhost:3000";

type BooksSearchTestContainer = {
  appUrl: string;
  magicLink: ReturnType<typeof createMagicLinkUseCases>;
  sessions: ReturnType<typeof createSessionUseCases>;
  google: ReturnType<typeof createGoogleUseCases> | null;
  searchBooks: SearchBooks;
};

const state = vi.hoisted(() => ({ container: null as unknown as BooksSearchTestContainer }));

vi.mock("@/app/api/_lib/server-container", () => ({
  getServerContainer: () => state.container,
}));

let auth: InMemoryAuth;
let idCounter: number;
let searchBooks: ReturnType<typeof vi.fn<SearchBooks>>;

function buildContainer(): BooksSearchTestContainer {
  const sessions = createSessionUseCases({
    users: auth.users,
    sessions: auth.sessions,
    tokens: auth.tokens,
    ids: { newId: () => `id-${++idCounter}` },
    now: () => new Date(),
  });
  return {
    appUrl: APP_URL,
    sessions,
    magicLink: createMagicLinkUseCases({
      magicLinkTokens: auth.magicLinkTokens,
      mailer: auth.mailer,
      tokens: auth.tokens,
      ids: { newId: () => `id-${++idCounter}` },
      now: () => new Date(),
      appUrl: APP_URL,
    }),
    google: null,
    searchBooks,
  };
}

function get(path: string, cookie?: string) {
  return new Request(`${APP_URL}${path}`, { headers: cookie ? { cookie } : {} });
}

async function sessionCookie(): Promise<string> {
  const { sessions } = state.container;
  const token = (await sessions.signInWithIdentity({ email: "reader@example.test" })).sessionToken;
  return `${SESSION_COOKIE_NAME}=${token}`;
}

describe("GET /api/books/search", () => {
  beforeEach(() => {
    auth = createInMemoryAuth();
    idCounter = 0;
    searchBooks = vi.fn<SearchBooks>();
    state.container = buildContainer();
  });

  it("returns 401 without a session", async () => {
    const { GET } = await import("@/app/api/books/search/route");
    const response = await GET(get("/api/books/search?q=prince"));
    expect(response.status).toBe(401);
  });

  it("returns 400 when query is missing", async () => {
    const { GET } = await import("@/app/api/books/search/route");
    const response = await GET(get("/api/books/search", await sessionCookie()));
    expect(response.status).toBe(400);
  });

  it("returns search results for authenticated requests", async () => {
    searchBooks.mockResolvedValue([{ isbn: "9782070368228", title: "Le Petit Prince" }]);
    const { GET } = await import("@/app/api/books/search/route");
    const response = await GET(get("/api/books/search?q=prince", await sessionCookie()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [{ isbn: "9782070368228", title: "Le Petit Prince" }],
    });
    expect(searchBooks).toHaveBeenCalledWith("prince", undefined);
  });

  it("returns 502 on provider errors", async () => {
    searchBooks.mockRejectedValue(new CatalogLookupError("upstream"));
    const { GET } = await import("@/app/api/books/search/route");
    const response = await GET(get("/api/books/search?q=prince", await sessionCookie()));
    expect(response.status).toBe(502);
  });
});
