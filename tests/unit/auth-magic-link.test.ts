import { beforeEach, describe, expect, it } from "vitest";
import {
  createMagicLinkUseCases,
  MAGIC_LINK_TTL_MS,
  type MagicLinkUseCases,
} from "../../src/application/auth/magic-link";
import { createInMemoryAuth, type InMemoryAuth } from "../helpers/in-memory-auth";

const APP_URL = "http://localhost:3000";
const START = new Date("2026-01-01T10:00:00Z");

describe("magic link use cases", () => {
  let auth: InMemoryAuth;
  let clock: Date;
  let useCases: MagicLinkUseCases;
  let idCounter: number;

  beforeEach(() => {
    auth = createInMemoryAuth();
    clock = new Date(START);
    idCounter = 0;
    useCases = createMagicLinkUseCases({
      magicLinkTokens: auth.magicLinkTokens,
      mailer: auth.mailer,
      tokens: auth.tokens,
      ids: { newId: () => `id-${++idCounter}` },
      now: () => clock,
      appUrl: APP_URL,
    });
  });

  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };

  describe("requestMagicLink", () => {
    it("stores only the hash of the token, never the raw token", async () => {
      await useCases.requestMagicLink("user@example.test");

      const [stored] = auth.magicLinkTokens.all();
      expect(stored.tokenHash).toBe(auth.tokens.hash("token-1"));
      expect(Object.values(stored)).not.toContain("token-1");
      expect(stored.email).toBe("user@example.test");
      expect(stored.consumedAt).toBeNull();
    });

    it("sets an expiry of about 15 minutes", async () => {
      await useCases.requestMagicLink("user@example.test");

      expect(MAGIC_LINK_TTL_MS).toBe(15 * 60 * 1000);
      expect(auth.magicLinkTokens.all()[0].expiresAt).toEqual(
        new Date(START.getTime() + MAGIC_LINK_TTL_MS),
      );
    });

    it("sends exactly one email with a /auth/verify link carrying the token", async () => {
      await useCases.requestMagicLink("user@example.test");

      expect(auth.mailer.sent).toEqual([
        { email: "user@example.test", link: `${APP_URL}/auth/verify?token=token-1` },
      ]);
    });

    it("normalizes the email (trim, lowercase)", async () => {
      await useCases.requestMagicLink("  User@Example.TEST ");

      expect(auth.mailer.sent[0].email).toBe("user@example.test");
      expect(auth.magicLinkTokens.all()[0].email).toBe("user@example.test");
    });

    it("answers the same way for a known and an unknown email", async () => {
      await auth.users.create({
        id: "u1",
        email: "known@example.test",
        googleSub: null,
        createdAt: START,
      });

      const known = await useCases.requestMagicLink("known@example.test");
      const unknown = await useCases.requestMagicLink("stranger@example.test");

      expect(known).toEqual(unknown);
      expect(auth.mailer.sent).toHaveLength(2);
      expect(auth.magicLinkTokens.all()).toHaveLength(2);
    });

    it("propagates a delivery failure", async () => {
      auth.mailer.failWith = new Error("smtp down");

      await expect(useCases.requestMagicLink("user@example.test")).rejects.toThrow("smtp down");
    });
  });

  describe("verifyMagicLink", () => {
    const tokenFromLink = (link: string) => new URL(link).searchParams.get("token") as string;

    it("returns the identity for a valid token", async () => {
      await useCases.requestMagicLink("user@example.test");
      const token = tokenFromLink(auth.mailer.sent[0].link);

      await expect(useCases.verifyMagicLink(token)).resolves.toEqual({
        email: "user@example.test",
      });
    });

    it("accepts a token only once", async () => {
      await useCases.requestMagicLink("user@example.test");
      const token = tokenFromLink(auth.mailer.sent[0].link);

      await useCases.verifyMagicLink(token);

      await expect(useCases.verifyMagicLink(token)).resolves.toBeNull();
    });

    it("rejects an expired token", async () => {
      await useCases.requestMagicLink("user@example.test");
      const token = tokenFromLink(auth.mailer.sent[0].link);
      advance(MAGIC_LINK_TTL_MS + 1);

      await expect(useCases.verifyMagicLink(token)).resolves.toBeNull();
    });

    it("accepts a token just before it expires", async () => {
      await useCases.requestMagicLink("user@example.test");
      const token = tokenFromLink(auth.mailer.sent[0].link);
      advance(MAGIC_LINK_TTL_MS - 1);

      await expect(useCases.verifyMagicLink(token)).resolves.toEqual({
        email: "user@example.test",
      });
    });

    it("rejects an unknown token", async () => {
      await expect(useCases.verifyMagicLink("nope")).resolves.toBeNull();
    });

    it("rejects an empty token", async () => {
      await expect(useCases.verifyMagicLink("")).resolves.toBeNull();
    });
  });
});
