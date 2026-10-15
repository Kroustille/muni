import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGoogleUseCases } from "../../src/application/auth/google";
import { createMagicLinkUseCases } from "../../src/application/auth/magic-link";
import { createSessionUseCases } from "../../src/application/auth/sessions";
import {
  createInMemoryAuth,
  FakeOAuthProvider,
  type InMemoryAuth,
} from "../helpers/in-memory-auth";

/**
 * Injection seam: route handlers obtain their dependencies only through
 * `getServerContainer()` from `src/app/api/_lib/server-container.ts`. Tests
 * replace that module, so no database, SMTP or Google is involved.
 */
const APP_URL = "http://localhost:3000";
const SESSION_COOKIE = "muni_session";
const FLOW_COOKIE = "muni_oauth_flow";

type Container = {
  appUrl: string;
  magicLink: ReturnType<typeof createMagicLinkUseCases>;
  sessions: ReturnType<typeof createSessionUseCases>;
  google: ReturnType<typeof createGoogleUseCases> | null;
};

const state = vi.hoisted(() => ({ container: null as unknown }));

vi.mock("@/app/api/_lib/server-container", () => ({
  getServerContainer: () => state.container,
}));

let auth: InMemoryAuth;
let idCounter: number;

function buildContainer(withGoogle: boolean): Container {
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
    google: withGoogle
      ? createGoogleUseCases({
          oauth: auth.oauth,
          signInWithIdentity: sessions.signInWithIdentity,
        })
      : null,
  };
}

function setCookies(response: Response): string[] {
  return response.headers.getSetCookie();
}

function cookieNamed(response: Response, name: string): string | undefined {
  return setCookies(response).find((cookie) => cookie.startsWith(`${name}=`));
}

function cookieValue(cookie: string): string {
  return cookie.split(";")[0].split("=")[1];
}

function location(response: Response): URL {
  return new URL(response.headers.get("location") as string, APP_URL);
}

function post(path: string, init: { body?: unknown; headers?: Record<string, string> } = {}) {
  return new Request(`${APP_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...init.headers },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function get(path: string, cookie?: string) {
  return new Request(`${APP_URL}${path}`, { headers: cookie ? { cookie } : {} });
}

async function signedInSessionToken(email = "user@example.test"): Promise<string> {
  const { sessions } = state.container as Container;
  return (await sessions.signInWithIdentity({ email })).sessionToken;
}

async function requestMagicLinkToken(email = "user@example.test"): Promise<string> {
  const { POST } = await import("@/app/api/auth/magic-link/route");
  await POST(post("/api/auth/magic-link", { body: { email } }));
  const link = auth.mailer.sent[auth.mailer.sent.length - 1].link;
  return new URL(link).searchParams.get("token") as string;
}

beforeEach(() => {
  auth = createInMemoryAuth();
  idCounter = 0;
  state.container = buildContainer(true);
  vi.unstubAllEnvs();
  vi.stubEnv("NODE_ENV", "production");
});

describe("POST /api/auth/magic-link", () => {
  it("emails a sign-in link and answers 200 { ok: true }", async () => {
    const { POST } = await import("@/app/api/auth/magic-link/route");

    const response = await POST(
      post("/api/auth/magic-link", { body: { email: "user@example.test" } }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(auth.mailer.sent).toHaveLength(1);
    expect(auth.mailer.sent[0].email).toBe("user@example.test");
  });

  it("does not enumerate accounts: known and unknown emails get identical answers", async () => {
    const { POST } = await import("@/app/api/auth/magic-link/route");
    await signedInSessionToken("known@example.test");

    const known = await POST(
      post("/api/auth/magic-link", { body: { email: "known@example.test" } }),
    );
    const unknown = await POST(
      post("/api/auth/magic-link", { body: { email: "stranger@example.test" } }),
    );

    expect(known.status).toBe(unknown.status);
    expect(await known.json()).toEqual(await unknown.json());
    expect(setCookies(known)).toEqual(setCookies(unknown));
  });

  it.each([{}, { email: "not-an-email" }, { email: 42 }])(
    "rejects an invalid body %j with 400",
    async (body) => {
      const { POST } = await import("@/app/api/auth/magic-link/route");

      const response = await POST(post("/api/auth/magic-link", { body }));

      expect(response.status).toBe(400);
      expect(auth.mailer.sent).toHaveLength(0);
    },
  );

  it("rejects a body that is not JSON with 400", async () => {
    const { POST } = await import("@/app/api/auth/magic-link/route");
    const request = new Request(`${APP_URL}/api/auth/magic-link`, { method: "POST", body: "nope" });

    expect((await POST(request)).status).toBe(400);
  });
});

describe("GET /auth/verify", () => {
  it("consumes a valid token, sets the session cookie and redirects to /", async () => {
    const { GET } = await import("@/app/auth/verify/route");
    const token = await requestMagicLinkToken();

    const response = await GET(get(`/auth/verify?token=${token}`));

    expect(response.status).toBe(307);
    expect(location(response).pathname).toBe("/");
    expect(cookieNamed(response, SESSION_COOKIE)).toBeDefined();
    expect(await auth.users.findByEmail("user@example.test")).not.toBeNull();
    expect(auth.sessions.size).toBe(1);
  });

  it("sets an opaque, HttpOnly, SameSite=Lax cookie on path /, Secure in production", async () => {
    const { GET } = await import("@/app/auth/verify/route");
    const token = await requestMagicLinkToken();

    const cookie = cookieNamed(
      await GET(get(`/auth/verify?token=${token}`)),
      SESSION_COOKIE,
    ) as string;

    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*Secure/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
    expect(cookie).toMatch(/;\s*Path=\//i);
    const sessionToken = cookieValue(cookie);
    expect(sessionToken).not.toContain("@");
    expect(await auth.sessions.findByTokenHash(sessionToken)).toBeNull();
    expect(await auth.sessions.findByTokenHash(auth.tokens.hash(sessionToken))).not.toBeNull();
  });

  it("omits Secure in development so http://localhost works", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { GET } = await import("@/app/auth/verify/route");
    const token = await requestMagicLinkToken();

    const cookie = cookieNamed(
      await GET(get(`/auth/verify?token=${token}`)),
      SESSION_COOKIE,
    ) as string;

    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
    expect(cookie).not.toMatch(/;\s*Secure/i);
  });

  it("redirects a used token to /sign-in?error=invalid_link without a cookie", async () => {
    const { GET } = await import("@/app/auth/verify/route");
    const token = await requestMagicLinkToken();
    await GET(get(`/auth/verify?token=${token}`));

    const response = await GET(get(`/auth/verify?token=${token}`));

    expect(location(response).pathname).toBe("/sign-in");
    expect(location(response).searchParams.get("error")).toBe("invalid_link");
    expect(cookieNamed(response, SESSION_COOKIE)).toBeUndefined();
    expect(auth.sessions.size).toBe(1);
  });

  it.each(["/auth/verify", "/auth/verify?token=", "/auth/verify?token=unknown"])(
    "redirects %s to /sign-in?error=invalid_link",
    async (path) => {
      const { GET } = await import("@/app/auth/verify/route");

      const response = await GET(get(path));

      expect(location(response).pathname).toBe("/sign-in");
      expect(location(response).searchParams.get("error")).toBe("invalid_link");
      expect(cookieNamed(response, SESSION_COOKIE)).toBeUndefined();
    },
  );
});

describe("GET /api/auth/session", () => {
  it("answers 200 { userId, email } for a valid session cookie", async () => {
    const { GET } = await import("@/app/api/auth/session/route");
    const token = await signedInSessionToken();

    const response = await GET(get("/api/auth/session", `${SESSION_COOKIE}=${token}`));

    expect(response.status).toBe(200);
    const user = await auth.users.findByEmail("user@example.test");
    expect(await response.json()).toEqual({ userId: user?.id, email: "user@example.test" });
  });

  it.each([
    ["no cookie", undefined],
    ["an unknown session", `${SESSION_COOKIE}=unknown`],
    ["an unrelated cookie", "other=1"],
  ])("answers 401 for %s", async (_label, cookie) => {
    const { GET } = await import("@/app/api/auth/session/route");

    const response = await GET(get("/api/auth/session", cookie));

    expect(response.status).toBe(401);
  });

  it("answers 401 after sign-out", async () => {
    const { GET } = await import("@/app/api/auth/session/route");
    const token = await signedInSessionToken();
    await (state.container as Container).sessions.signOut(token);

    expect((await GET(get("/api/auth/session", `${SESSION_COOKIE}=${token}`))).status).toBe(401);
  });
});

describe("POST /api/auth/sign-out", () => {
  it("deletes the session and clears the cookie for a same-origin request", async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");
    const token = await signedInSessionToken();

    const response = await POST(
      post("/api/auth/sign-out", {
        headers: { origin: APP_URL, cookie: `${SESSION_COOKIE}=${token}` },
      }),
    );

    expect(response.status).toBeLessThan(300);
    expect(auth.sessions.size).toBe(0);
    const cleared = cookieNamed(response, SESSION_COOKIE) as string;
    expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    expect(cleared).toMatch(/;\s*Path=\//i);
  });

  it("rejects a cross-origin request with 403 and keeps the session", async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");
    const token = await signedInSessionToken();

    const response = await POST(
      post("/api/auth/sign-out", {
        headers: { origin: "https://evil.example", cookie: `${SESSION_COOKIE}=${token}` },
      }),
    );

    expect(response.status).toBe(403);
    expect(auth.sessions.size).toBe(1);
    expect(cookieNamed(response, SESSION_COOKIE)).toBeUndefined();
  });

  it("rejects a request without an Origin header with 403", async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");
    const token = await signedInSessionToken();

    const response = await POST(
      post("/api/auth/sign-out", { headers: { cookie: `${SESSION_COOKIE}=${token}` } }),
    );

    expect(response.status).toBe(403);
    expect(auth.sessions.size).toBe(1);
  });

  it("succeeds idempotently without a session", async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");

    const response = await POST(post("/api/auth/sign-out", { headers: { origin: APP_URL } }));

    expect(response.status).toBeLessThan(300);
  });
});

describe("GET /api/auth/google", () => {
  it("redirects to the provider and keeps the flow state in a short-lived HttpOnly cookie", async () => {
    const { GET } = await import("@/app/api/auth/google/route");

    const response = await GET(get("/api/auth/google"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(FakeOAuthProvider.redirectUrl);
    const cookie = cookieNamed(response, FLOW_COOKIE) as string;
    expect(cookieValue(cookie)).toBe(FakeOAuthProvider.flowState);
    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
    expect(cookie).toMatch(/;\s*Secure/i);
    const maxAge = Number(/Max-Age=(\d+)/i.exec(cookie)?.[1]);
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(3600);
  });

  it("answers 404 when Google is not configured", async () => {
    state.container = buildContainer(false);
    const { GET } = await import("@/app/api/auth/google/route");

    const response = await GET(get("/api/auth/google"));

    expect(response.status).toBe(404);
    expect(cookieNamed(response, FLOW_COOKIE)).toBeUndefined();
  });
});

describe("GET /auth/callback", () => {
  const callback = "/auth/callback?code=auth-code&state=state-from-google";
  const flowCookie = `${FLOW_COOKIE}=${FakeOAuthProvider.flowState}`;

  it("completes the flow, sets the session cookie, clears the flow cookie and redirects to /", async () => {
    auth.oauth.acceptIdentity({ email: "g@example.test", googleSub: "sub-1" });
    const { GET } = await import("@/app/auth/callback/route");

    const response = await GET(get(callback, flowCookie));

    expect(response.status).toBe(307);
    expect(location(response).pathname).toBe("/");
    expect(auth.oauth.completions).toEqual([
      {
        params: { code: "auth-code", state: "state-from-google" },
        flowState: FakeOAuthProvider.flowState,
      },
    ]);
    const session = cookieNamed(response, SESSION_COOKIE) as string;
    expect(session).toMatch(/;\s*HttpOnly/i);
    expect(session).toMatch(/;\s*SameSite=Lax/i);
    expect(session).toMatch(/;\s*Secure/i);
    expect(cookieNamed(response, FLOW_COOKIE)).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    expect((await auth.users.findByGoogleSub("sub-1"))?.email).toBe("g@example.test");
  });

  it("redirects to /sign-in?error=google_failed when the provider rejects the sign-in", async () => {
    auth.oauth.rejectWith("email_not_verified");
    const { GET } = await import("@/app/auth/callback/route");

    const response = await GET(get(callback, flowCookie));

    expect(location(response).pathname).toBe("/sign-in");
    expect(location(response).searchParams.get("error")).toBe("google_failed");
    expect(cookieNamed(response, SESSION_COOKIE)).toBeUndefined();
    expect(auth.sessions.size).toBe(0);
  });

  it("redirects to google_failed when the flow state cookie is missing or does not match", async () => {
    const { GET } = await import("@/app/auth/callback/route");

    for (const cookie of [undefined, `${FLOW_COOKIE}=another-flow-state`]) {
      const response = await GET(get(callback, cookie));

      expect(location(response).searchParams.get("error")).toBe("google_failed");
      expect(cookieNamed(response, SESSION_COOKIE)).toBeUndefined();
    }
    expect(auth.sessions.size).toBe(0);
  });

  it("redirects to /sign-in?error=google_unavailable when Google is not configured", async () => {
    state.container = buildContainer(false);
    const { GET } = await import("@/app/auth/callback/route");

    const response = await GET(get(callback, flowCookie));

    expect(location(response).pathname).toBe("/sign-in");
    expect(location(response).searchParams.get("error")).toBe("google_unavailable");
    expect(cookieNamed(response, SESSION_COOKIE)).toBeUndefined();
  });
});
