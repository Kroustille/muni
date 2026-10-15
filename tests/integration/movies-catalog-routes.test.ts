import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGoogleUseCases } from "@/application/auth/google";
import { createMagicLinkUseCases } from "@/application/auth/magic-link";
import { createSessionUseCases } from "@/application/auth/sessions";
import type { FetchMovieCatalogDetail } from "@/application/movies/search-movies";
import type { SearchMovies } from "@/application/movies/search-movies";
import { MovieCatalogSearchError } from "@/application/ports/movie-catalog-search";
import { createInMemoryAuth, type InMemoryAuth } from "../helpers/in-memory-auth";
import { SESSION_COOKIE_NAME } from "@/app/api/_lib/auth-cookies";

const APP_URL = "http://localhost:3000";

type MoviesCatalogTestContainer = {
  appUrl: string;
  magicLink: ReturnType<typeof createMagicLinkUseCases>;
  sessions: ReturnType<typeof createSessionUseCases>;
  google: ReturnType<typeof createGoogleUseCases> | null;
  searchMovies: SearchMovies;
  fetchMovieCatalogDetail: FetchMovieCatalogDetail;
};

const state = vi.hoisted(() => ({ container: null as unknown as MoviesCatalogTestContainer }));

vi.mock("@/app/api/_lib/server-container", () => ({
  getServerContainer: () => state.container,
}));

let auth: InMemoryAuth;
let idCounter: number;
let searchMovies: ReturnType<typeof vi.fn<SearchMovies>>;
let fetchMovieCatalogDetail: ReturnType<typeof vi.fn<FetchMovieCatalogDetail>>;

function buildContainer(): MoviesCatalogTestContainer {
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
    searchMovies,
    fetchMovieCatalogDetail,
  };
}

function get(path: string, cookie?: string) {
  return new Request(`${APP_URL}${path}`, { headers: cookie ? { cookie } : {} });
}

async function sessionCookie(): Promise<string> {
  const { sessions } = state.container;
  const token = (await sessions.signInWithIdentity({ email: "cinephile@example.test" })).sessionToken;
  return `${SESSION_COOKIE_NAME}=${token}`;
}

describe("movie catalog routes", () => {
  beforeEach(() => {
    auth = createInMemoryAuth();
    idCounter = 0;
    searchMovies = vi.fn<SearchMovies>();
    fetchMovieCatalogDetail = vi.fn<FetchMovieCatalogDetail>();
    state.container = buildContainer();
  });

  describe("GET /api/movies/search", () => {
    it("returns 401 without a session", async () => {
      const { GET } = await import("@/app/api/movies/search/route");
      const response = await GET(get("/api/movies/search?q=amelie"));
      expect(response.status).toBe(401);
    });

    it("returns 400 when q is missing", async () => {
      const { GET } = await import("@/app/api/movies/search/route");
      const response = await GET(get("/api/movies/search", await sessionCookie()));
      expect(response.status).toBe(400);
    });

    it("returns 200 with search results", async () => {
      searchMovies.mockResolvedValue([
        { wikidataId: "Q193048", title: "Amélie", mediaKind: "film" },
      ]);
      const { GET } = await import("@/app/api/movies/search/route");
      const response = await GET(get("/api/movies/search?q=Amélie", await sessionCookie()));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        results: [{ wikidataId: "Q193048", title: "Amélie", mediaKind: "film" }],
      });
    });

    it("returns 502 when the provider fails", async () => {
      searchMovies.mockRejectedValue(new MovieCatalogSearchError("Wikidata down"));
      const { GET } = await import("@/app/api/movies/search/route");
      const response = await GET(get("/api/movies/search?q=x", await sessionCookie()));
      expect(response.status).toBe(502);
    });
  });

  describe("GET /api/movies/entity", () => {
    it("returns 404 when entity is missing", async () => {
      fetchMovieCatalogDetail.mockResolvedValue(null);
      const { GET } = await import("@/app/api/movies/entity/route");
      const response = await GET(get("/api/movies/entity?id=Q193048", await sessionCookie()));
      expect(response.status).toBe(404);
    });

    it("returns 200 with entity detail", async () => {
      fetchMovieCatalogDetail.mockResolvedValue({
        wikidataId: "Q193048",
        title: "Amélie",
        mediaKind: "film",
        synopsis: "Résumé",
      });
      const { GET } = await import("@/app/api/movies/entity/route");
      const response = await GET(get("/api/movies/entity?id=Q193048", await sessionCookie()));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ synopsis: "Résumé" });
    });
  });
});
