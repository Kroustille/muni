import { describe, expect, it, vi } from "vitest";
import { createHttpAuthGateway } from "@/adapters/http/auth-gateway";
import { RemoteStoreError } from "@/application/ports/remote-store";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setup(response: Response | Error) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  const navigate = vi.fn();
  const gateway = createHttpAuthGateway({
    fetch: fetch as unknown as typeof globalThis.fetch,
    baseUrl: "https://muni.test",
    navigate,
  });
  return { fetch, navigate, gateway };
}

describe("HTTP AuthGateway", () => {
  it("requests a magic link with a JSON POST", async () => {
    const { fetch, gateway } = setup(json({ ok: true }, 202));
    await gateway.startMagicLinkSignIn("a@b.co");
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://muni.test/api/auth/magic-link");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ email: "a@b.co" });
  });

  it("maps a rejected magic-link request to a validation error", async () => {
    const { gateway } = setup(json({ error: "invalid" }, 400));
    await expect(gateway.startMagicLinkSignIn("nope")).rejects.toMatchObject({
      kind: "validation",
    });
  });

  it("maps a network failure on magic link to a network error", async () => {
    const { gateway } = setup(new TypeError("offline"));
    const error = await gateway.startMagicLinkSignIn("a@b.co").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RemoteStoreError);
    expect(error).toMatchObject({ kind: "network" });
  });

  it("reads an authenticated session, sending cookies", async () => {
    const { fetch, gateway } = setup(json({ userId: "u1", email: "a@b.co" }));
    await expect(gateway.currentSession()).resolves.toEqual({
      status: "authenticated",
      session: { userId: "u1", email: "a@b.co" },
    });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://muni.test/api/auth/session");
    expect(init?.credentials).toBe("include");
  });

  it("maps a 401 session response to expired", async () => {
    const { gateway } = setup(json({ error: "unauthenticated" }, 401));
    await expect(gateway.currentSession()).resolves.toEqual({ status: "expired" });
  });

  it("rejects with a network error when the session cannot be read", async () => {
    const { gateway } = setup(new TypeError("offline"));
    await expect(gateway.currentSession()).rejects.toMatchObject({ kind: "network" });
  });

  it("signs out with a POST", async () => {
    const { fetch, gateway } = setup(new Response(null, { status: 204 }));
    await gateway.signOut();
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://muni.test/api/auth/sign-out");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
  });

  it("redirects the browser to the Google endpoint", () => {
    const { fetch, navigate, gateway } = setup(json({}));
    gateway.startGoogleSignIn();
    expect(navigate).toHaveBeenCalledWith("https://muni.test/api/auth/google");
    expect(fetch).not.toHaveBeenCalled();
  });
});
