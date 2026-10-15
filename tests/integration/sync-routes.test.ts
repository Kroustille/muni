import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGoogleUseCases } from "../../src/application/auth/google";
import { createMagicLinkUseCases } from "../../src/application/auth/magic-link";
import {
  createSessionUseCases,
  SESSION_TTL_MS,
  type SessionUseCases,
} from "../../src/application/auth/sessions";
import type { PullResult } from "../../src/application/ports/remote-store";
import { merge } from "../../src/domain/merge";
import { itemWireSchema, type ItemWire } from "../../src/domain/item";
import {
  createInMemoryAuth,
  FakeOAuthProvider,
  type InMemoryAuth,
} from "../helpers/in-memory-auth";
import { InMemoryServerItemRepository } from "../helpers/in-memory-server-item-repository";
import { SESSION_COOKIE_NAME } from "@/app/api/_lib/auth-cookies";

/**
 * Injection seam: sync route handlers resolve dependencies only through
 * `getServerContainer()` from `src/app/api/_lib/server-container.ts`. Tests
 * replace that module with an extended container (auth + `items` + `sync`).
 *
 * These tests fail until T090 (route handlers and server composition) land;
 * they currently fail with "Cannot find module", not a setup problem.
 *
 * Route paths (Next.js App Router):
 * - `POST`  `src/app/api/sync/push/route.ts`  → `/api/sync/push`
 * - `GET`   `src/app/api/sync/pull/route.ts`  → `/api/sync/pull?since=&limit=`
 *
 * Expected extended container shape (wired in T090):
 * - `appUrl`, `magicLink`, `sessions`, `google` — same as `ServerContainer`
 * - `items` — `ServerItemRepository` (tests use `InMemoryServerItemRepository`)
 * - `sync` — `{ push(userId, items), pull(userId, since, limit) }` from `createSyncService`
 */

/** Must match the batch limit enforced in the push route handler (T090). */
export const SYNC_PUSH_MAX_ITEMS = 500;

const APP_URL = "http://localhost:3000";
const NOW = "2026-01-01T10:00:00.000Z";
const HLC = "1767261600000-0-device-a";

export type SyncUseCases = {
  push(userId: string, items: ItemWire[]): Promise<ItemWire[]>;
  pull(userId: string, since: string | null, limit: number): Promise<PullResult>;
};

export type SyncRouteTestContainer = {
  appUrl: string;
  magicLink: ReturnType<typeof createMagicLinkUseCases>;
  sessions: SessionUseCases;
  google: ReturnType<typeof createGoogleUseCases> | null;
  items: InMemoryServerItemRepository;
  sync: SyncUseCases;
};

const state = vi.hoisted(() => ({
  container: null as unknown as SyncRouteTestContainer,
  now: () => new Date("2026-06-01T12:00:00.000Z"),
}));

vi.mock("@/app/api/_lib/server-container", () => ({
  getServerContainer: () => state.container,
}));

let auth: InMemoryAuth;
let idCounter: number;

function createHarnessSync(items: InMemoryServerItemRepository): SyncUseCases {
  let clock = 0;
  const nextServerUpdatedAt = () =>
    new Date(Date.UTC(2026, 0, 1, 0, 0, ++clock)).toISOString();

  return {
    async push(userId, incoming) {
      return items.transaction(async (repo) => {
        const results: ItemWire[] = [];
        for (const wire of incoming) {
          const locked = await repo.findByIds(userId, [wire.id]);
          const existing = locked[0];
          let merged: ItemWire;
          if (!existing) {
            merged = { ...wire, server_updated_at: nextServerUpdatedAt() };
          } else {
            merged = merge(existing, wire);
            if (JSON.stringify(merged) !== JSON.stringify(existing)) {
              merged = { ...merged, server_updated_at: nextServerUpdatedAt() };
            }
          }
          await repo.upsert(userId, [merged]);
          results.push(merged);
        }
        return results;
      });
    },

    async pull(userId, since, limit) {
      const batch = await items.listSince(userId, since, limit);
      const last = batch.at(-1);
      const cursor = last?.server_updated_at ?? since ?? "";
      return { items: batch, cursor };
    },
  };
}

function buildContainer(): SyncRouteTestContainer {
  const items = new InMemoryServerItemRepository();
  const sessions = createSessionUseCases({
    users: auth.users,
    sessions: auth.sessions,
    tokens: auth.tokens,
    ids: { newId: () => `id-${++idCounter}` },
    now: () => state.now(),
  });
  return {
    appUrl: APP_URL,
    sessions,
    items,
    sync: createHarnessSync(items),
    magicLink: createMagicLinkUseCases({
      magicLinkTokens: auth.magicLinkTokens,
      mailer: auth.mailer,
      tokens: auth.tokens,
      ids: { newId: () => `id-${++idCounter}` },
      now: () => state.now(),
      appUrl: APP_URL,
    }),
    google: createGoogleUseCases({
      oauth: auth.oauth,
      signInWithIdentity: sessions.signInWithIdentity,
    }),
  };
}

function sampleWire(overrides: Record<string, unknown> = {}): ItemWire {
  return itemWireSchema.parse({
    id: "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a10",
    type: "shopping",
    title: "Lait",
    created_at: NOW,
    author: null,
    status: null,
    recommended_by: null,
    rating: null,
    notes: null,
    quantity: null,
    checked: false,
    ingredients: null,
    steps: null,
    deleted_at: null,
    fields_updated_at: { title: HLC },
    server_updated_at: null,
    ...overrides,
  });
}

function post(
  path: string,
  init: { body?: unknown; headers?: Record<string, string> } = {},
) {
  return new Request(`${APP_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...init.headers },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function get(path: string, headers: Record<string, string> = {}) {
  return new Request(`${APP_URL}${path}`, { headers });
}

async function sessionToken(email: string): Promise<string> {
  return (await state.container.sessions.signInWithIdentity({ email })).sessionToken;
}

function authedPost(
  path: string,
  body: unknown,
  token: string,
  origin: string | null = APP_URL,
) {
  const headers: Record<string, string> = {
    cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
  if (origin !== null) headers.origin = origin;
  return post(path, { body, headers });
}

function authedGet(path: string, token: string) {
  return get(path, { cookie: `${SESSION_COOKIE_NAME}=${token}` });
}

beforeEach(() => {
  auth = createInMemoryAuth();
  idCounter = 0;
  state.now = () => new Date("2026-06-01T12:00:00.000Z");
  state.container = buildContainer();
  vi.unstubAllEnvs();
  vi.stubEnv("NODE_ENV", "production");
});

describe("POST /api/sync/push", () => {
  it.each([
    ["no cookie", undefined],
    ["an unknown session", `${SESSION_COOKIE_NAME}=unknown`],
    ["an unrelated cookie", "other=1"],
  ])("answers 401 for %s", async (_label, cookie) => {
    const { POST } = await import("@/app/api/sync/push/route");
    const headers: Record<string, string> = { origin: APP_URL };
    if (cookie !== undefined) headers.cookie = cookie;

    expect((await POST(post("/api/sync/push", { body: { items: [] }, headers }))).status).toBe(
      401,
    );
  });

  it("answers 401 when the session is expired", async () => {
    const token = await sessionToken("user@example.test");
    const signedInAt = state.now();
    state.now = () => new Date(signedInAt.getTime() + SESSION_TTL_MS + 1);
    const { POST } = await import("@/app/api/sync/push/route");

    const response = await POST(
      authedPost("/api/sync/push", { items: [sampleWire()] }, token),
    );

    expect(response.status).toBe(401);
  });

  it.each([
    ["a cross-origin request", "https://evil.example"],
    ["a request without an Origin header", null],
  ])("rejects %s with 403", async (_label, origin) => {
    const { POST } = await import("@/app/api/sync/push/route");
    const token = await sessionToken("user@example.test");

    const response = await POST(
      authedPost("/api/sync/push", { items: [sampleWire()] }, token, origin),
    );

    expect(response.status).toBe(403);
    const userId = await userIdForEmail("user@example.test");
    expect(state.container.items.getRow(userId, sampleWire().id)).toBeUndefined();
  });

  it("accepts a same-origin push and returns merged items", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const token = await sessionToken("user@example.test");
    const wire = sampleWire();

    const response = await POST(authedPost("/api/sync/push", { items: [wire] }, token));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe("Lait");
    expect(body.items[0].server_updated_at).toBeTruthy();
  });

  it("rejects a row carrying user_id with 422 per-row errors", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const token = await sessionToken("user@example.test");

    const response = await POST(
      authedPost(
        "/api/sync/push",
        { items: [{ ...sampleWire(), user_id: "attacker" }] },
        token,
      ),
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.errors).toEqual([
      expect.objectContaining({
        index: 0,
        id: sampleWire().id,
        message: expect.stringMatching(/user_id/i),
      }),
    ]);
  });

  it("rejects invalid rows with 422 per-row errors without persisting them", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const token = await sessionToken("user@example.test");
    const userId = await userIdForEmail("user@example.test");
    const bad = { ...sampleWire(), title: "" };

    const response = await POST(authedPost("/api/sync/push", { items: [bad] }, token));

    expect(response.status).toBe(422);
    expect((await response.json()).errors[0]).toMatchObject({ index: 0, id: bad.id });
    expect(state.container.items.getRow(userId, bad.id)).toBeUndefined();
  });

  it(`rejects more than ${SYNC_PUSH_MAX_ITEMS} items with 422 per-row errors`, async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const token = await sessionToken("user@example.test");
    const items = Array.from({ length: SYNC_PUSH_MAX_ITEMS + 1 }, (_, index) =>
      sampleWire({
        id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        title: `Item ${index}`,
      }),
    );

    const response = await POST(authedPost("/api/sync/push", { items }, token));

    expect(response.status).toBe(422);
    const { errors } = await response.json();
    expect(errors.some((error: { index: number }) => error.index >= SYNC_PUSH_MAX_ITEMS)).toBe(
      true,
    );
  });

  it("scopes writes to the session user, not a user_id field in the payload", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const token = await sessionToken("alice@example.test");
    const wire = sampleWire({ title: "Alice item" });

    const response = await POST(authedPost("/api/sync/push", { items: [wire] }, token));
    expect(response.status).toBe(200);

    const aliceId = await userIdForEmail("alice@example.test");
    expect(state.container.items.getRow(aliceId, wire.id)?.title).toBe("Alice item");
    expect(state.container.items.getRow("other-user-id", wire.id)).toBeUndefined();
  });
});

describe("GET /api/sync/pull", () => {
  it("answers 401 without a valid session", async () => {
    const { GET } = await import("@/app/api/sync/pull/route");

    expect((await GET(get("/api/sync/pull?limit=10"))).status).toBe(401);
  });

  it("answers 401 when the session is expired", async () => {
    const token = await sessionToken("user@example.test");
    const signedInAt = state.now();
    state.now = () => new Date(signedInAt.getTime() + SESSION_TTL_MS + 1);
    const { GET } = await import("@/app/api/sync/pull/route");

    expect((await GET(authedGet("/api/sync/pull?limit=10", token))).status).toBe(401);
  });

  it("returns only the caller's rows ordered by server_updated_at", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const { GET } = await import("@/app/api/sync/pull/route");
    const tokenA = await sessionToken("alice@example.test");
    const tokenB = await sessionToken("bob@example.test");
    const sharedId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    await POST(
      authedPost(
        "/api/sync/push",
        { items: [sampleWire({ id: sharedId, title: "Alice copy" })] },
        tokenA,
      ),
    );
    await POST(
      authedPost(
        "/api/sync/push",
        { items: [sampleWire({ id: sharedId, title: "Bob copy" })] },
        tokenB,
      ),
    );

    const pullA = await GET(authedGet("/api/sync/pull?limit=10", tokenA));
    const pullB = await GET(authedGet("/api/sync/pull?limit=10", tokenB));

    expect(pullA.status).toBe(200);
    expect(pullB.status).toBe(200);
    const bodyA = await pullA.json();
    const bodyB = await pullB.json();
    expect(bodyA.items).toHaveLength(1);
    expect(bodyB.items).toHaveLength(1);
    expect(bodyA.items[0].title).toBe("Alice copy");
    expect(bodyB.items[0].title).toBe("Bob copy");
  });

  it("honours since and limit query parameters", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const { GET } = await import("@/app/api/sync/pull/route");
    const token = await sessionToken("user@example.test");
    const first = sampleWire({
      id: "11111111-1111-4111-8111-111111111111",
      title: "First",
    });
    const second = sampleWire({
      id: "22222222-2222-4222-8222-222222222222",
      title: "Second",
    });

    const push = await POST(authedPost("/api/sync/push", { items: [first, second] }, token));
    expect(push.status).toBe(200);
    const pushed = (await push.json()).items as ItemWire[];
    const cursorAfterFirst = pushed[0].server_updated_at as string;

    const page = await GET(
      authedGet(
        `/api/sync/pull?since=${encodeURIComponent(cursorAfterFirst)}&limit=1`,
        token,
      ),
    );

    expect(page.status).toBe(200);
    const body = await page.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(second.id);
    expect(body.cursor).toBe(pushed[1].server_updated_at);
  });
});

describe("cross-session isolation", () => {
  it("prevents one signed-in user from reading or overwriting another user's data", async () => {
    const { POST } = await import("@/app/api/sync/push/route");
    const { GET } = await import("@/app/api/sync/pull/route");
    const tokenA = await sessionToken("alice@example.test");
    const tokenB = await sessionToken("bob@example.test");
    const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    await POST(
      authedPost(
        "/api/sync/push",
        {
          items: [
            sampleWire({
              id: itemId,
              title: "Alice secret",
              fields_updated_at: { title: "2000-0-dev-a" },
            }),
          ],
        },
        tokenA,
      ),
    );

    const bobPull = await GET(authedGet("/api/sync/pull?limit=50", tokenB));
    expect((await bobPull.json()).items).toEqual([]);

    await POST(
      authedPost(
        "/api/sync/push",
        {
          items: [
            sampleWire({
              id: itemId,
              title: "Bob overwrite attempt",
              fields_updated_at: { title: "3000-0-dev-b" },
            }),
          ],
        },
        tokenB,
      ),
    );

    const alicePull = await GET(authedGet("/api/sync/pull?limit=50", tokenA));
    expect((await alicePull.json()).items[0].title).toBe("Alice secret");

    const bobPullAfter = await GET(authedGet("/api/sync/pull?limit=50", tokenB));
    expect((await bobPullAfter.json()).items[0].title).toBe("Bob overwrite attempt");
  });
});

async function userIdForEmail(email: string): Promise<string> {
  const user = await auth.users.findByEmail(email);
  if (!user) throw new Error(`missing user ${email}`);
  return user.id;
}
