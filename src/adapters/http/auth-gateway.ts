import type { AuthGateway, Session, SessionState } from "@/application/ports/auth-gateway";
import { RemoteStoreError } from "@/application/ports/remote-store";

export type HttpAuthGatewayDeps = {
  fetch: typeof globalThis.fetch;
  baseUrl: string;
  navigate: (url: string) => void;
};

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export function createHttpAuthGateway(deps: HttpAuthGatewayDeps): AuthGateway {
  const { fetch, baseUrl, navigate } = deps;

  return {
    async startMagicLinkSignIn(email: string): Promise<void> {
      try {
        const response = await fetch(joinUrl(baseUrl, "/api/auth/magic-link"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
          credentials: "include",
        });
        if (response.status === 400) {
          throw new RemoteStoreError("validation");
        }
        if (!response.ok) {
          throw new RemoteStoreError("network", [], `HTTP ${response.status}`);
        }
      } catch (error) {
        if (error instanceof RemoteStoreError) throw error;
        if (isNetworkFailure(error)) throw new RemoteStoreError("network");
        throw error;
      }
    },

    startGoogleSignIn(): void {
      navigate(joinUrl(baseUrl, "/api/auth/google"));
    },

    async currentSession(): Promise<SessionState> {
      try {
        const response = await fetch(joinUrl(baseUrl, "/api/auth/session"), {
          credentials: "include",
        });
        if (response.status === 401) {
          return { status: "expired" };
        }
        if (!response.ok) {
          throw new RemoteStoreError("network", [], `HTTP ${response.status}`);
        }
        const body = (await readJson(response)) as { userId?: string; email?: string };
        if (!body?.userId || !body.email) {
          return { status: "unauthenticated" };
        }
        const session: Session = { userId: body.userId, email: body.email };
        return { status: "authenticated", session };
      } catch (error) {
        if (error instanceof RemoteStoreError) throw error;
        if (isNetworkFailure(error)) throw new RemoteStoreError("network");
        throw error;
      }
    },

    async signOut(): Promise<void> {
      await fetch(joinUrl(baseUrl, "/api/auth/sign-out"), {
        method: "POST",
        credentials: "include",
      });
    },
  };
}
