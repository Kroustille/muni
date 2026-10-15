export interface MagicLinkToken {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface MagicLinkTokenRepository {
  create(token: MagicLinkToken): Promise<void>;
  /**
   * Atomically marks the token consumed when it exists, is unexpired at `now`
   * and is unused. Returns its email, or null otherwise. Exactly one of
   * several concurrent attempts may succeed.
   */
  consume(tokenHash: string, now: Date): Promise<{ email: string } | null>;
}
