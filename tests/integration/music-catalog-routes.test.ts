import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGoogleUseCases } from "@/application/auth/google";
import { createMagicLinkUseCases } from "@/application/auth/magic-link";
import { createSessionUseCases } from "@/application/auth/sessions";
import type { SearchMusicArtists } from "@/application/music/search-music";
import type { SearchMusicTracks } from "@/application/music/search-music";
import { MusicCatalogSearchError } from "@/application/ports/music-catalog-search";
import { createInMemoryAuth, type InMemoryAuth } from "../helpers/in-memory-auth";
import { SESSION_COOKIE_NAME } from "@/app/api/_lib/auth-cookies";

const APP_URL = "http://localhost:3000";

type MusicCatalogTestContainer = {
  appUrl: string;
  magicLink: ReturnType<typeof createMagicLinkUseCases>;
  sessions: ReturnType<typeof createSessionUseCases>;
  google: ReturnType<typeof createGoogleUseCases> | null;
  searchMusicArtists: SearchMusicArtists;
  searchMusicTracks: SearchMusicTracks;
};

const state = vi.hoisted(() => ({ container: null as unknown as MusicCatalogTestContainer }));

vi.mock("@/app/api/_lib/server-container", () => ({
  getServerContainer: () => state.container,
}));

let auth: InMemoryAuth;
let idCounter: number;
let searchMusicArtists: ReturnType<typeof vi.fn<SearchMusicArtists>>;
let searchMusicTracks: ReturnType<typeof vi.fn<SearchMusicTracks>>;

function buildContainer(): MusicCatalogTestContainer {
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
    searchMusicArtists,
    searchMusicTracks,
  };
}

async function sessionCookie(): Promise<string> {
  const { sessions } = state.container;
  const token = (await sessions.signInWithIdentity({ email: "listener@example.test" }))
    .sessionToken;
  return `${SESSION_COOKIE_NAME}=${token}`;
}

describe("music catalog routes", () => {
  beforeEach(() => {
    auth = createInMemoryAuth();
    idCounter = 0;
    searchMusicArtists = vi.fn<SearchMusicArtists>();
    searchMusicTracks = vi.fn<SearchMusicTracks>();
    state.container = buildContainer();
  });

  it("GET /api/music/artists/search returns 401 without session", async () => {
    const { GET } = await import("@/app/api/music/artists/search/route");
    const response = await GET(new Request(`${APP_URL}/api/music/artists/search?q=test`));
    expect(response.status).toBe(401);
  });

  it("GET /api/music/tracks/search returns results for authenticated user", async () => {
    searchMusicTracks.mockResolvedValue([
      {
        musicBrainzRecordingId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
        title: "Time (You and I)",
        artist: "Khruangbin",
      },
    ]);
    const { GET } = await import("@/app/api/music/tracks/search/route");
    const response = await GET(
      new Request(`${APP_URL}/api/music/tracks/search?q=time`, {
        headers: { cookie: await sessionCookie() },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { results: unknown[] };
    expect(body.results).toHaveLength(1);
  });

  it("maps provider errors to 502", async () => {
    searchMusicArtists.mockRejectedValue(new MusicCatalogSearchError("fail"));
    const { GET } = await import("@/app/api/music/artists/search/route");
    const response = await GET(
      new Request(`${APP_URL}/api/music/artists/search?q=kh`, {
        headers: { cookie: await sessionCookie() },
      }),
    );
    expect(response.status).toBe(502);
  });
});
