import type { AuthGateway } from "./ports/auth-gateway";
import type { Connectivity } from "./ports/connectivity";
import type { MetaStore } from "./ports/item-repository";

export type OpenResult =
  | { status: "sign-in-required"; offline: boolean }
  | { status: "ready"; userId: string; reauthRequired: boolean };

export type SessionUseCases = {
  open(): Promise<OpenResult>;
  signOut(): Promise<void>;
};

export type SessionUseCasesDeps = {
  gateway: AuthGateway;
  meta: MetaStore;
  connectivity: Connectivity;
};

function isUnreachable(error: unknown): boolean {
  return error instanceof Error;
}

export function createSessionUseCases(deps: SessionUseCasesDeps): SessionUseCases {
  const { gateway, meta, connectivity } = deps;

  return {
    async open(): Promise<OpenResult> {
      const storedUserId = await meta.get("userId");

      if (!storedUserId) {
        if (!connectivity.isOnline()) {
          return { status: "sign-in-required", offline: true };
        }
        try {
          const session = await gateway.currentSession();
          if (session.status === "authenticated") {
            await meta.set("userId", session.session.userId);
            return {
              status: "ready",
              userId: session.session.userId,
              reauthRequired: false,
            };
          }
          return { status: "sign-in-required", offline: false };
        } catch (error) {
          if (isUnreachable(error)) {
            return { status: "sign-in-required", offline: true };
          }
          throw error;
        }
      }

      if (!connectivity.isOnline()) {
        return { status: "ready", userId: storedUserId, reauthRequired: false };
      }

      try {
        const session = await gateway.currentSession();
        if (session.status === "authenticated") {
          return { status: "ready", userId: storedUserId, reauthRequired: false };
        }
        return { status: "ready", userId: storedUserId, reauthRequired: true };
      } catch (error) {
        if (isUnreachable(error)) {
          return { status: "ready", userId: storedUserId, reauthRequired: false };
        }
        throw error;
      }
    },

    async signOut(): Promise<void> {
      await gateway.signOut();
      await meta.set("userId", "");
    },
  };
}
