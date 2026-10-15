import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresMagicLinkTokenRepository } from "@/adapters/postgres/magic-link-token-repository";
import { createPostgresSessionRepository } from "@/adapters/postgres/session-repository";
import { createPostgresUserRepository } from "@/adapters/postgres/user-repository";
import type { MagicLinkTokenRepository } from "@/application/ports/magic-link-token-repository";
import type { SessionRepository } from "@/application/ports/session-repository";
import type { UserRepository } from "@/application/ports/user-repository";
import { createTestDatabase, type TestDatabase } from "../helpers/postgres-test-db";

const NOW = new Date("2026-01-01T12:00:00.000Z");
const minutes = (count: number): Date => new Date(NOW.getTime() + count * 60_000);

let testDb: TestDatabase;
let users: UserRepository;
let sessions: SessionRepository;
let tokens: MagicLinkTokenRepository;
let counter = 0;
const uniqueId = (): string =>
  `00000000-0000-4000-8000-${String((counter += 1)).padStart(12, "0")}`;

beforeAll(async () => {
  testDb = await createTestDatabase();
  users = createPostgresUserRepository(testDb.db);
  sessions = createPostgresSessionRepository(testDb.db);
  tokens = createPostgresMagicLinkTokenRepository(testDb.db);
});

afterAll(async () => {
  await testDb?.destroy();
});

const newUser = (email: string, googleSub: string | null = null) => ({
  id: uniqueId(),
  email,
  googleSub,
  createdAt: NOW,
});

describe("PostgreSQL UserRepository", () => {
  it("creates a user and finds it by id, email and google sub", async () => {
    const created = await users.create(newUser("ada@example.test", "sub-ada"));
    expect(created.email).toBe("ada@example.test");
    expect(created.createdAt.getTime()).toBe(NOW.getTime());
    expect(await users.findById(created.id)).toEqual(created);
    expect(await users.findByEmail("ada@example.test")).toEqual(created);
    expect(await users.findByGoogleSub("sub-ada")).toEqual(created);
  });

  it("returns null for unknown users", async () => {
    expect(await users.findById(uniqueId())).toBeNull();
    expect(await users.findByEmail("nobody@example.test")).toBeNull();
    expect(await users.findByGoogleSub("unknown-sub")).toBeNull();
  });

  it("stores and matches emails lowercased", async () => {
    const created = await users.create(newUser("Grace@Example.TEST"));
    expect(created.email).toBe("grace@example.test");
    expect((await users.findByEmail("GRACE@example.test"))?.id).toBe(created.id);
  });

  it("rejects a second user whose email differs only by case", async () => {
    await users.create(newUser("linus@example.test"));
    await expect(users.create(newUser("LINUS@example.test"))).rejects.toThrow();
  });

  it("rejects a duplicate google sub but allows several users without one", async () => {
    await users.create(newUser("g1@example.test", "sub-shared"));
    await expect(users.create(newUser("g2@example.test", "sub-shared"))).rejects.toThrow();
    await users.create(newUser("n1@example.test"));
    await users.create(newUser("n2@example.test"));
  });

  it("links a google sub to an existing user", async () => {
    const created = await users.create(newUser("link@example.test"));
    const linked = await users.linkGoogleSub(created.id, "sub-link");
    expect(linked.googleSub).toBe("sub-link");
    expect((await users.findByGoogleSub("sub-link"))?.id).toBe(created.id);
  });

  it("refuses to link a google sub already owned by another user", async () => {
    await users.create(newUser("owner@example.test", "sub-owned"));
    const other = await users.create(newUser("other@example.test"));
    await expect(users.linkGoogleSub(other.id, "sub-owned")).rejects.toThrow();
  });
});

describe("PostgreSQL SessionRepository", () => {
  const newSession = async (tokenHash: string) => {
    const user = await users.create(newUser(`${tokenHash}@example.test`));
    return {
      id: uniqueId(),
      userId: user.id,
      tokenHash,
      createdAt: NOW,
      expiresAt: minutes(60),
      lastSeenAt: NOW,
    };
  };

  it("finds a session by token hash with its expiry", async () => {
    const session = await newSession("hash-find");
    await sessions.create(session);
    expect(await sessions.findByTokenHash("hash-find")).toEqual(session);
  });

  it("returns null for an unknown token hash", async () => {
    expect(await sessions.findByTokenHash("hash-unknown")).toBeNull();
  });

  it("rejects two sessions with the same token hash", async () => {
    const first = await newSession("hash-dup");
    await sessions.create(first);
    await expect(sessions.create({ ...first, id: uniqueId() })).rejects.toThrow();
  });

  it("rejects a session for an unknown user", async () => {
    const session = await newSession("hash-orphan");
    await expect(sessions.create({ ...session, userId: uniqueId() })).rejects.toThrow();
  });

  it("touch moves last seen and expiry (sliding expiry)", async () => {
    const session = await newSession("hash-touch");
    await sessions.create(session);
    await sessions.touch("hash-touch", minutes(30), minutes(90));
    const found = await sessions.findByTokenHash("hash-touch");
    expect(found?.lastSeenAt.getTime()).toBe(minutes(30).getTime());
    expect(found?.expiresAt.getTime()).toBe(minutes(90).getTime());
    expect(found?.createdAt.getTime()).toBe(NOW.getTime());
  });

  it("touch on an unknown token hash does nothing", async () => {
    await expect(sessions.touch("hash-missing", NOW, minutes(10))).resolves.toBeUndefined();
  });

  it("deletes a session by token hash and ignores unknown ones", async () => {
    const session = await newSession("hash-delete");
    await sessions.create(session);
    await sessions.deleteByTokenHash("hash-delete");
    expect(await sessions.findByTokenHash("hash-delete")).toBeNull();
    await expect(sessions.deleteByTokenHash("hash-delete")).resolves.toBeUndefined();
  });
});

describe("PostgreSQL MagicLinkTokenRepository", () => {
  const newToken = (tokenHash: string, expiresAt: Date = minutes(15)) => ({
    id: uniqueId(),
    email: "magic@example.test",
    tokenHash,
    expiresAt,
    consumedAt: null,
  });

  it("consumes a valid token and returns its email", async () => {
    await tokens.create(newToken("tok-valid"));
    expect(await tokens.consume("tok-valid", NOW)).toEqual({ email: "magic@example.test" });
  });

  it("consumes a token only once", async () => {
    await tokens.create(newToken("tok-once"));
    expect(await tokens.consume("tok-once", NOW)).not.toBeNull();
    expect(await tokens.consume("tok-once", NOW)).toBeNull();
  });

  it("refuses an expired token, including at the exact expiry instant", async () => {
    await tokens.create(newToken("tok-expired", minutes(15)));
    expect(await tokens.consume("tok-expired", minutes(15))).toBeNull();
    expect(await tokens.consume("tok-expired", minutes(16))).toBeNull();
  });

  it("does not burn a token on a failed (expired) attempt", async () => {
    await tokens.create(newToken("tok-retry", minutes(15)));
    expect(await tokens.consume("tok-retry", minutes(20))).toBeNull();
    expect(await tokens.consume("tok-retry", minutes(10))).not.toBeNull();
  });

  it("returns null for an unknown token hash", async () => {
    expect(await tokens.consume("tok-unknown", NOW)).toBeNull();
  });

  it("rejects two tokens with the same hash", async () => {
    await tokens.create(newToken("tok-dup"));
    await expect(tokens.create(newToken("tok-dup"))).rejects.toThrow();
  });

  it("lets exactly one of many concurrent attempts consume the token", async () => {
    await tokens.create(newToken("tok-race"));
    const results = await Promise.all(
      Array.from({ length: 20 }, () => tokens.consume("tok-race", NOW)),
    );
    expect(results.filter((result) => result !== null)).toHaveLength(1);
  });
});
