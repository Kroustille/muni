import { createHash } from "node:crypto";
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey } from "jose";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createGoogleOAuthProvider } from "../../src/adapters/google/oauth-provider";

const ISSUER = "https://accounts.google.test";
const CLIENT_ID = "client-id-123";
const REDIRECT_URI = "http://localhost:3000/auth/callback";

interface IdTokenOptions {
  issuer?: string;
  audience?: string;
  nonce?: string;
  expiresIn?: string | number;
  email?: string;
  emailVerified?: boolean;
  key?: CryptoKey;
}

describe("Google OIDC OAuthProvider adapter", () => {
  let signingKey: CryptoKey;
  let otherKey: CryptoKey;
  let jwks: { keys: unknown[] };
  let requests: { url: string; body: string | null }[];

  beforeAll(async () => {
    const pair = await generateKeyPair("RS256");
    const other = await generateKeyPair("RS256");
    signingKey = pair.privateKey;
    otherKey = other.privateKey;
    jwks = {
      keys: [{ ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256", use: "sig" }],
    };
  });

  let idTokenToReturn = "";

  const mockFetch: typeof fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const body = init?.body ? String(init.body) : null;
    requests.push({ url, body });
    const json = (value: unknown) =>
      new Response(JSON.stringify(value), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    if (url === `${ISSUER}/.well-known/openid-configuration`) {
      return json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        code_challenge_methods_supported: ["S256"],
      });
    }
    if (url === `${ISSUER}/jwks`) return json(jwks);
    if (url === `${ISSUER}/token`) {
      return json({ access_token: "access", token_type: "Bearer", id_token: idTokenToReturn });
    }
    return new Response("not found", { status: 404 });
  };

  const makeProvider = () =>
    createGoogleOAuthProvider({
      clientId: CLIENT_ID,
      clientSecret: "secret",
      redirectUri: REDIRECT_URI,
      issuer: ISSUER,
      fetch: mockFetch,
    });

  async function signIdToken(options: IdTokenOptions): Promise<string> {
    return new SignJWT({
      nonce: options.nonce,
      email: options.email ?? "user@example.test",
      email_verified: options.emailVerified ?? true,
    })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(options.issuer ?? ISSUER)
      .setAudience(options.audience ?? CLIENT_ID)
      .setSubject("google-sub-1")
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? "5m")
      .sign(options.key ?? signingKey);
  }

  async function begin() {
    const provider = makeProvider();
    const started = await provider.begin();
    const url = new URL(started.redirectUrl);
    return { provider, started, url };
  }

  beforeEach(() => {
    requests = [];
    idTokenToReturn = "";
  });

  describe("begin", () => {
    it("builds an authorization URL with PKCE S256, state and nonce", async () => {
      const { url } = await begin();
      expect(`${url.origin}${url.pathname}`).toBe(`${ISSUER}/authorize`);
      expect(url.searchParams.get("client_id")).toBe(CLIENT_ID);
      expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toContain("openid");
      expect(url.searchParams.get("scope")).toContain("email");
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("code_challenge")).toBeTruthy();
      expect(url.searchParams.get("state")).toBeTruthy();
      expect(url.searchParams.get("nonce")).toBeTruthy();
    });

    it("returns a non-empty flow state to keep in the cookie, without leaking the client secret", async () => {
      const { started } = await begin();
      expect(started.flowState.length).toBeGreaterThan(0);
      expect(started.flowState).not.toContain("secret");
    });

    it("uses fresh state, nonce and PKCE values on each call", async () => {
      const first = await begin();
      const second = await begin();
      for (const name of ["state", "nonce", "code_challenge"]) {
        expect(first.url.searchParams.get(name)).not.toBe(second.url.searchParams.get(name));
      }
      expect(first.started.flowState).not.toBe(second.started.flowState);
    });

    it("keeps the PKCE verifier out of the URL but consistent with the challenge", async () => {
      const { started, url } = await begin();
      const challenge = url.searchParams.get("code_challenge");
      expect(challenge).toBeTruthy();
      expect(started.flowState).not.toContain(challenge as string);
    });
  });

  describe("complete", () => {
    it("exchanges the code with the PKCE verifier and returns the verified identity", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({ nonce: url.searchParams.get("nonce") as string });

      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );

      expect(result).toEqual({
        authenticated: true,
        identity: { email: "user@example.test", googleSub: "google-sub-1" },
      });
      const tokenCall = requests.find((r) => r.url === `${ISSUER}/token`);
      const params = new URLSearchParams(tokenCall?.body ?? "");
      expect(params.get("grant_type")).toBe("authorization_code");
      expect(params.get("code")).toBe("auth-code");
      const verifier = params.get("code_verifier") as string;
      expect(verifier).toBeTruthy();
      const expectedChallenge = createHash("sha256").update(verifier).digest("base64url");
      expect(expectedChallenge).toBe(url.searchParams.get("code_challenge"));
    });

    it("rejects a callback whose state does not match the flow state, without calling the token endpoint", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({ nonce: url.searchParams.get("nonce") as string });

      const result = await provider.complete(
        { code: "auth-code", state: "forged-state" },
        started.flowState,
      );

      expect(result).toMatchObject({ authenticated: false, rejected: true });
      expect(requests.some((r) => r.url === `${ISSUER}/token`)).toBe(false);
    });

    it("rejects a callback without state", async () => {
      const { provider, started } = await begin();
      const result = await provider.complete({ code: "auth-code" }, started.flowState);
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an unreadable flow state", async () => {
      const { provider } = await begin();
      const result = await provider.complete({ code: "c", state: "s" }, "garbage");
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects a provider error callback", async () => {
      const { provider, started, url } = await begin();
      const result = await provider.complete(
        { error: "access_denied", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an id token whose nonce does not match", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({ nonce: "another-nonce" });
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an id token without nonce", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({});
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an id token with the wrong issuer", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({
        nonce: url.searchParams.get("nonce") as string,
        issuer: "https://evil.example",
      });
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an id token for another audience", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({
        nonce: url.searchParams.get("nonce") as string,
        audience: "someone-else",
      });
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an expired id token", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({
        nonce: url.searchParams.get("nonce") as string,
        expiresIn: Math.floor(Date.now() / 1000) - 3600,
      });
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an id token with an invalid signature", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({
        nonce: url.searchParams.get("nonce") as string,
        key: otherKey,
      });
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });

    it("rejects an unverified email", async () => {
      const { provider, started, url } = await begin();
      idTokenToReturn = await signIdToken({
        nonce: url.searchParams.get("nonce") as string,
        emailVerified: false,
      });
      const result = await provider.complete(
        { code: "auth-code", state: url.searchParams.get("state") as string },
        started.flowState,
      );
      expect(result).toMatchObject({ authenticated: false, rejected: true });
    });
  });
});
