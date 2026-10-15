import type { IdGenerator } from "../ports/id-generator";
import type { SessionRepository } from "../ports/session-repository";
import type { TokenGenerator } from "../ports/token-generator";
import type { UserRepository } from "../ports/user-repository";

/** Sliding window: each validation pushes the expiry this far from now. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionDeps {
  users: UserRepository;
  sessions: SessionRepository;
  tokens: TokenGenerator;
  ids: IdGenerator;
  now: () => Date;
}

export interface SignInIdentity {
  email: string;
  googleSub?: string;
}

export interface SessionUseCases {
  signInWithIdentity(
    identity: SignInIdentity,
  ): Promise<{ userId: string; sessionToken: string; expiresAt: Date }>;
  validateSession(token: string): Promise<{ userId: string; email: string } | null>;
  signOut(token: string): Promise<void>;
}

export function createSessionUseCases(deps: SessionDeps): SessionUseCases {
  async function findOrCreateUser(identity: SignInIdentity) {
    const email = identity.email.trim().toLowerCase();
    const googleSub = identity.googleSub ?? null;

    if (googleSub !== null) {
      const bySub = await deps.users.findByGoogleSub(googleSub);
      if (bySub) return bySub;
    }
    const byEmail = await deps.users.findByEmail(email);
    if (byEmail) {
      if (googleSub !== null && byEmail.googleSub === null) {
        return deps.users.linkGoogleSub(byEmail.id, googleSub);
      }
      return byEmail;
    }
    return deps.users.create({
      id: deps.ids.newId(),
      email,
      googleSub,
      createdAt: deps.now(),
    });
  }

  return {
    async signInWithIdentity(identity) {
      const user = await findOrCreateUser(identity);
      const now = deps.now();
      const sessionToken = deps.tokens.generate();
      const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
      await deps.sessions.create({
        id: deps.ids.newId(),
        userId: user.id,
        tokenHash: deps.tokens.hash(sessionToken),
        createdAt: now,
        expiresAt,
        lastSeenAt: now,
      });
      return { userId: user.id, sessionToken, expiresAt };
    },

    async validateSession(token) {
      if (token === "") return null;
      const tokenHash = deps.tokens.hash(token);
      const session = await deps.sessions.findByTokenHash(tokenHash);
      if (!session) return null;
      const now = deps.now();
      if (session.expiresAt.getTime() <= now.getTime()) return null;
      const user = await deps.users.findById(session.userId);
      if (!user) return null;
      await deps.sessions.touch(tokenHash, now, new Date(now.getTime() + SESSION_TTL_MS));
      return { userId: user.id, email: user.email };
    },

    async signOut(token) {
      await deps.sessions.deleteByTokenHash(deps.tokens.hash(token));
    },
  };
}
