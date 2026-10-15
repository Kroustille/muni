export type Session = { userId: string; email: string };

export type SessionState =
  | { status: "authenticated"; session: Session }
  | { status: "expired" }
  | { status: "unauthenticated" };

export interface AuthGateway {
  startMagicLinkSignIn(email: string): Promise<void>;
  startGoogleSignIn(): void;
  currentSession(): Promise<SessionState>;
  signOut(): Promise<void>;
}
