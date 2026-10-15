import { beforeEach, describe, expect, it } from "vitest";
import {
  createSessionUseCases,
  SESSION_TTL_MS,
  type SessionUseCases,
} from "../../src/application/auth/sessions";
import { createInMemoryAuth, type InMemoryAuth } from "../helpers/in-memory-auth";

const START = new Date("2026-01-01T10:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("session use cases", () => {
  let auth: InMemoryAuth;
  let clock: Date;
  let useCases: SessionUseCases;
  let idCounter: number;

  beforeEach(() => {
    auth = createInMemoryAuth();
    clock = new Date(START);
    idCounter = 0;
    useCases = createSessionUseCases({
      users: auth.users,
      sessions: auth.sessions,
      tokens: auth.tokens,
      ids: { newId: () => `id-${++idCounter}` },
      now: () => clock,
    });
  });

  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };

  describe("signInWithIdentity", () => {
    it("creates the user for a new email without a google_sub (magic link)", async () => {
      const result = await useCases.signInWithIdentity({ email: "New@Example.test" });

      const user = await auth.users.findByEmail("new@example.test");
      expect(user).not.toBeNull();
      expect(user?.googleSub).toBeNull();
      expect(user?.email).toBe("new@example.test");
      expect(result.userId).toBe(user?.id);
    });

    it("creates the user with its google_sub for a new Google identity", async () => {
      const result = await useCases.signInWithIdentity({
        email: "g@example.test",
        googleSub: "sub-1",
      });

      const user = await auth.users.findByGoogleSub("sub-1");
      expect(user?.id).toBe(result.userId);
      expect(user?.email).toBe("g@example.test");
    });

    it("finds an existing user by google_sub even when the email differs", async () => {
      const first = await useCases.signInWithIdentity({
        email: "old@example.test",
        googleSub: "sub-1",
      });

      const second = await useCases.signInWithIdentity({
        email: "changed@example.test",
        googleSub: "sub-1",
      });

      expect(second.userId).toBe(first.userId);
      expect(await auth.users.findByEmail("changed@example.test")).toBeNull();
    });

    it("gives the same user to a magic-link and a Google sign-in with the same email", async () => {
      const viaMagicLink = await useCases.signInWithIdentity({ email: "user@example.test" });

      const viaGoogle = await useCases.signInWithIdentity({
        email: "USER@example.test",
        googleSub: "sub-1",
      });

      expect(viaGoogle.userId).toBe(viaMagicLink.userId);
      expect((await auth.users.findById(viaMagicLink.userId))?.googleSub).toBe("sub-1");
    });

    it("keeps the same user when a Google user later signs in by magic link", async () => {
      const viaGoogle = await useCases.signInWithIdentity({
        email: "user@example.test",
        googleSub: "sub-1",
      });

      const viaMagicLink = await useCases.signInWithIdentity({ email: "user@example.test" });

      expect(viaMagicLink.userId).toBe(viaGoogle.userId);
      expect((await auth.users.findById(viaGoogle.userId))?.googleSub).toBe("sub-1");
    });

    it("creates a session storing only the token hash, with a sliding expiry", async () => {
      const result = await useCases.signInWithIdentity({ email: "user@example.test" });

      expect(SESSION_TTL_MS).toBeGreaterThan(0);
      expect(result.sessionToken).toBe("token-1");
      expect(result.expiresAt).toEqual(new Date(START.getTime() + SESSION_TTL_MS));
      const stored = await auth.sessions.findByTokenHash(auth.tokens.hash("token-1"));
      expect(stored).toMatchObject({
        userId: result.userId,
        tokenHash: auth.tokens.hash("token-1"),
        createdAt: START,
        lastSeenAt: START,
        expiresAt: result.expiresAt,
      });
      expect(await auth.sessions.findByTokenHash("token-1")).toBeNull();
    });
  });

  describe("validateSession", () => {
    it("returns the user id and email for a valid token", async () => {
      const { userId, sessionToken } = await useCases.signInWithIdentity({
        email: "user@example.test",
      });

      expect(await useCases.validateSession(sessionToken)).toEqual({
        userId,
        email: "user@example.test",
      });
    });

    it("extends the expiry and last seen time on each validation", async () => {
      const { sessionToken } = await useCases.signInWithIdentity({ email: "user@example.test" });
      advance(10 * DAY_MS);

      await useCases.validateSession(sessionToken);

      const stored = await auth.sessions.findByTokenHash(auth.tokens.hash(sessionToken));
      expect(stored?.lastSeenAt).toEqual(clock);
      expect(stored?.expiresAt).toEqual(new Date(clock.getTime() + SESSION_TTL_MS));
    });

    it("stays valid past the original expiry when used regularly", async () => {
      const { sessionToken } = await useCases.signInWithIdentity({ email: "user@example.test" });
      const step = SESSION_TTL_MS - DAY_MS;

      advance(step);
      expect(await useCases.validateSession(sessionToken)).not.toBeNull();
      advance(step);
      expect(await useCases.validateSession(sessionToken)).not.toBeNull();
    });

    it("rejects an expired session and does not extend it", async () => {
      const { sessionToken } = await useCases.signInWithIdentity({ email: "user@example.test" });
      advance(SESSION_TTL_MS);

      expect(await useCases.validateSession(sessionToken)).toBeNull();
      const stored = await auth.sessions.findByTokenHash(auth.tokens.hash(sessionToken));
      expect(stored?.expiresAt).toEqual(new Date(START.getTime() + SESSION_TTL_MS));
    });

    it("rejects an unknown token", async () => {
      expect(await useCases.validateSession("not-a-session")).toBeNull();
    });

    it("rejects the raw hash used as a token (lookup is by hash of the token)", async () => {
      const { sessionToken } = await useCases.signInWithIdentity({ email: "user@example.test" });

      expect(await useCases.validateSession(auth.tokens.hash(sessionToken))).toBeNull();
    });

    it("rejects a revoked session", async () => {
      const { sessionToken } = await useCases.signInWithIdentity({ email: "user@example.test" });
      await auth.sessions.deleteByTokenHash(auth.tokens.hash(sessionToken));

      expect(await useCases.validateSession(sessionToken)).toBeNull();
    });

    it("rejects a session whose user no longer exists", async () => {
      await auth.sessions.create({
        id: "orphan",
        userId: "missing-user",
        tokenHash: auth.tokens.hash("orphan-token"),
        createdAt: START,
        expiresAt: new Date(START.getTime() + SESSION_TTL_MS),
        lastSeenAt: START,
      });

      expect(await useCases.validateSession("orphan-token")).toBeNull();
    });
  });

  describe("signOut", () => {
    it("deletes the session so it can no longer be validated", async () => {
      const { sessionToken } = await useCases.signInWithIdentity({ email: "user@example.test" });

      await useCases.signOut(sessionToken);

      expect(auth.sessions.size).toBe(0);
      expect(await useCases.validateSession(sessionToken)).toBeNull();
    });

    it("keeps other sessions of the same user", async () => {
      const first = await useCases.signInWithIdentity({ email: "user@example.test" });
      const second = await useCases.signInWithIdentity({ email: "user@example.test" });

      await useCases.signOut(first.sessionToken);

      expect(await useCases.validateSession(second.sessionToken)).not.toBeNull();
    });

    it("is a no-op for an unknown token", async () => {
      await expect(useCases.signOut("not-a-session")).resolves.toBeUndefined();
    });
  });
});
