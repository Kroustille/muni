import type { AuthGateway, SessionState } from "../../src/application/ports/auth-gateway";

export class FakeAuthGateway implements AuthGateway {
  state: SessionState = { status: "unauthenticated" };
  unreachable = false;
  readonly magicLinkRequests: string[] = [];
  googleStarts = 0;
  signOuts = 0;

  async startMagicLinkSignIn(email: string): Promise<void> {
    this.assertReachable();
    this.magicLinkRequests.push(email);
  }

  startGoogleSignIn(): void {
    this.googleStarts += 1;
  }

  async currentSession(): Promise<SessionState> {
    this.assertReachable();
    return this.state;
  }

  async signOut(): Promise<void> {
    this.assertReachable();
    this.signOuts += 1;
    this.state = { status: "unauthenticated" };
  }

  private assertReachable(): void {
    if (this.unreachable) throw new Error("network unreachable");
  }
}
