export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
}

export interface SessionRepository {
  create(session: Session): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  /** Sliding expiry: records activity and moves the expiry. */
  touch(tokenHash: string, lastSeenAt: Date, expiresAt: Date): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}
