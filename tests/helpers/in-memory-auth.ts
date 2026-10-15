import { createHash } from "node:crypto";
import type {
  MagicLinkToken,
  MagicLinkTokenRepository,
} from "../../src/application/ports/magic-link-token-repository";
import type { Mailer } from "../../src/application/ports/mailer";
import type {
  OAuthBegin,
  OAuthCompletion,
  OAuthIdentity,
  OAuthProvider,
} from "../../src/application/ports/oauth-provider";
import type { Session, SessionRepository } from "../../src/application/ports/session-repository";
import type { TokenGenerator } from "../../src/application/ports/token-generator";
import type { NewUser, User, UserRepository } from "../../src/application/ports/user-repository";

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const wanted = email.toLowerCase();
    return [...this.users.values()].find((user) => user.email === wanted) ?? null;
  }

  async findByGoogleSub(googleSub: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.googleSub === googleSub) ?? null;
  }

  async create(newUser: NewUser): Promise<User> {
    const email = newUser.email.toLowerCase();
    if (await this.findByEmail(email)) throw new Error(`Duplicate email: ${email}`);
    if (newUser.googleSub !== null && (await this.findByGoogleSub(newUser.googleSub))) {
      throw new Error(`Duplicate google_sub: ${newUser.googleSub}`);
    }
    const user: User = { ...newUser, email };
    this.users.set(user.id, user);
    return user;
  }

  async linkGoogleSub(userId: string, googleSub: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`Unknown user: ${userId}`);
    const owner = await this.findByGoogleSub(googleSub);
    if (owner && owner.id !== userId) throw new Error(`Duplicate google_sub: ${googleSub}`);
    const linked: User = { ...user, googleSub };
    this.users.set(userId, linked);
    return linked;
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async create(session: Session): Promise<void> {
    this.sessions.set(session.tokenHash, { ...session });
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const session = this.sessions.get(tokenHash);
    return session ? { ...session } : null;
  }

  async touch(tokenHash: string, lastSeenAt: Date, expiresAt: Date): Promise<void> {
    const session = this.sessions.get(tokenHash);
    if (session) this.sessions.set(tokenHash, { ...session, lastSeenAt, expiresAt });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  get size(): number {
    return this.sessions.size;
  }
}

export class InMemoryMagicLinkTokenRepository implements MagicLinkTokenRepository {
  private readonly tokens = new Map<string, MagicLinkToken>();

  async create(token: MagicLinkToken): Promise<void> {
    this.tokens.set(token.tokenHash, { ...token });
  }

  async consume(tokenHash: string, now: Date): Promise<{ email: string } | null> {
    const token = this.tokens.get(tokenHash);
    if (!token || token.consumedAt !== null || token.expiresAt.getTime() <= now.getTime()) {
      return null;
    }
    this.tokens.set(tokenHash, { ...token, consumedAt: now });
    return { email: token.email };
  }

  /** Test inspection: all stored tokens (hashes only, never raw tokens). */
  all(): MagicLinkToken[] {
    return [...this.tokens.values()].map((token) => ({ ...token }));
  }
}

export interface SentEmail {
  email: string;
  link: string;
}

export class RecordingMailer implements Mailer {
  readonly sent: SentEmail[] = [];
  failWith: Error | null = null;

  async sendMagicLink(email: string, link: string): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push({ email, link });
  }
}

export type FakeOAuthOutcome = OAuthCompletion;

export class FakeOAuthProvider implements OAuthProvider {
  static readonly redirectUrl = "https://accounts.example.test/authorize";
  static readonly flowState = "fake-flow-state";

  outcome: FakeOAuthOutcome;
  readonly completions: { params: Record<string, string>; flowState: string }[] = [];
  beginCalls = 0;

  constructor(identity: OAuthIdentity = { email: "user@example.test", googleSub: "google-sub-1" }) {
    this.outcome = { authenticated: true, identity };
  }

  rejectWith(reason: string): void {
    this.outcome = { authenticated: false, rejected: true, reason };
  }

  acceptIdentity(identity: OAuthIdentity): void {
    this.outcome = { authenticated: true, identity };
  }

  async begin(): Promise<OAuthBegin> {
    this.beginCalls += 1;
    return { redirectUrl: FakeOAuthProvider.redirectUrl, flowState: FakeOAuthProvider.flowState };
  }

  async complete(
    callbackParams: Readonly<Record<string, string>>,
    flowState: string,
  ): Promise<OAuthCompletion> {
    this.completions.push({ params: { ...callbackParams }, flowState });
    if (flowState !== FakeOAuthProvider.flowState) {
      return { authenticated: false, rejected: true, reason: "state_mismatch" };
    }
    return this.outcome;
  }
}

/** Deterministic tokens: token-1, token-2, ...; hash is a stable SHA-256 hex. */
export class DeterministicTokenGenerator implements TokenGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `token-${this.counter}`;
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

export interface InMemoryAuth {
  users: InMemoryUserRepository;
  sessions: InMemorySessionRepository;
  magicLinkTokens: InMemoryMagicLinkTokenRepository;
  mailer: RecordingMailer;
  oauth: FakeOAuthProvider;
  tokens: DeterministicTokenGenerator;
}

export function createInMemoryAuth(): InMemoryAuth {
  return {
    users: new InMemoryUserRepository(),
    sessions: new InMemorySessionRepository(),
    magicLinkTokens: new InMemoryMagicLinkTokenRepository(),
    mailer: new RecordingMailer(),
    oauth: new FakeOAuthProvider(),
    tokens: new DeterministicTokenGenerator(),
  };
}
