import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGoogleUseCases } from "@/application/auth/google";
import { createMagicLinkUseCases } from "@/application/auth/magic-link";
import { createSessionUseCases } from "@/application/auth/sessions";
import type { LookupBook } from "@/application/books/lookup-book";
import { CatalogLookupError } from "@/application/ports/book-catalog-lookup";
import { createInMemoryAuth, type InMemoryAuth } from "../helpers/in-memory-auth";
import { SESSION_COOKIE_NAME } from "@/app/api/_lib/auth-cookies";

const APP_URL = "http://localhost:3000";

type BooksLookupTestContainer = {
  appUrl: string;
  magicLink: ReturnType<typeof createMagicLinkUseCases>;
  sessions: ReturnType<typeof createSessionUseCases>;
  google: ReturnType<typeof createGoogleUseCases> | null;
  lookupBook: LookupBook;
};

const state = vi.hoisted(() => ({ container: null as unknown as BooksLookupTestContainer }));

vi.mock("@/app/api/_lib/server-container", () => ({
  getServerContainer: () => state.container,
}));

let auth: InMemoryAuth;
let idCounter: number;
let lookupBook: ReturnType<typeof vi.fn<LookupBook>>;

function buildContainer(): BooksLookupTestContainer {
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
    lookupBook,
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

describe("GET /api/books/lookup", () => {
  beforeEach(() => {
    auth = createInMemoryAuth();
    idCounter = 0;
    lookupBook = vi.fn<LookupBook>();
    state.container = buildContainer();
  });

  it("returns 401 without a session", async () => {
    const { GET } = await import("@/app/api/books/lookup/route");
    const response = await GET(get("/api/books/lookup?isbn=9782070368228"));
    expect(response.status).toBe(401);
  });

  it("returns 400 when isbn is missing", async () => {
    const { GET } = await import("@/app/api/books/lookup/route");
    const response = await GET(get("/api/books/lookup", await sessionCookie()));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid ISBN", async () => {
    const { GET } = await import("@/app/api/books/lookup/route");
    const response = await GET(
      get("/api/books/lookup?isbn=not-valid", await sessionCookie()),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_isbn" });
    expect(lookupBook).not.toHaveBeenCalled();
  });

  it("returns 404 when the catalog has no match", async () => {
    lookupBook.mockResolvedValue(null);
    const { GET } = await import("@/app/api/books/lookup/route");
    const response = await GET(
      get("/api/books/lookup?isbn=9782070368228", await sessionCookie()),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("returns 200 with a catalog hit", async () => {
    lookupBook.mockResolvedValue({
      isbn: "9782070368228",
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
    });
    const { GET } = await import("@/app/api/books/lookup/route");
    const response = await GET(
      get("/api/books/lookup?isbn=9782070368228", await sessionCookie()),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      isbn: "9782070368228",
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
    });
  });

  it("returns 502 when the catalog provider fails", async () => {
    lookupBook.mockRejectedValue(new CatalogLookupError("Open Library down"));
    const { GET } = await import("@/app/api/books/lookup/route");
    const response = await GET(
      get("/api/books/lookup?isbn=9782070368228", await sessionCookie()),
    );
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: "provider_error" });
  });
});
