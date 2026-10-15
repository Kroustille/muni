import { beforeEach, describe, expect, it } from "vitest";
import {
  createGoogleUseCases,
  type GoogleUseCases,
  type SignInWithIdentity,
} from "../../src/application/auth/google";
import {
  createInMemoryAuth,
  FakeOAuthProvider,
  type InMemoryAuth,
} from "../helpers/in-memory-auth";

const IDENTITY = { email: "user@example.test", googleSub: "google-sub-1" };
const CALLBACK = { code: "auth-code", state: "state-from-google" };

describe("Google sign-in use cases", () => {
  let auth: InMemoryAuth;
  let useCases: GoogleUseCases;
  let signInCalls: unknown[];
  let signInError: Error | null;

  const signInWithIdentity: SignInWithIdentity = async (identity) => {
    signInCalls.push(identity);
    if (signInError) throw signInError;
    return {
      userId: "user-1",
      sessionToken: "session-token-1",
      expiresAt: new Date("2026-02-01T00:00:00Z"),
    };
  };

  beforeEach(() => {
    auth = createInMemoryAuth();
    auth.oauth.acceptIdentity(IDENTITY);
    signInCalls = [];
    signInError = null;
    useCases = createGoogleUseCases({ oauth: auth.oauth, signInWithIdentity });
  });

  describe("beginGoogleSignIn", () => {
    it("returns the provider redirect URL and the flow state to keep", async () => {
      const result = await useCases.beginGoogleSignIn();

      expect(result).toEqual({
        redirectUrl: FakeOAuthProvider.redirectUrl,
        flowState: FakeOAuthProvider.flowState,
      });
      expect(auth.oauth.beginCalls).toBe(1);
    });

    it("does not sign anyone in", async () => {
      await useCases.beginGoogleSignIn();

      expect(signInCalls).toHaveLength(0);
    });
  });

  describe("completeGoogleSignIn", () => {
    it("passes the callback parameters and flow state to the provider", async () => {
      await useCases.completeGoogleSignIn(CALLBACK, FakeOAuthProvider.flowState);

      expect(auth.oauth.completions).toEqual([
        { params: CALLBACK, flowState: FakeOAuthProvider.flowState },
      ]);
    });

    it("maps a verified identity to a session through signInWithIdentity", async () => {
      const result = await useCases.completeGoogleSignIn(CALLBACK, FakeOAuthProvider.flowState);

      expect(signInCalls).toEqual([IDENTITY]);
      expect(result).toEqual({
        signedIn: true,
        session: {
          userId: "user-1",
          sessionToken: "session-token-1",
          expiresAt: new Date("2026-02-01T00:00:00Z"),
        },
      });
    });

    it("maps a provider rejection to an error without creating a session", async () => {
      auth.oauth.rejectWith("email_not_verified");

      const result = await useCases.completeGoogleSignIn(CALLBACK, FakeOAuthProvider.flowState);

      expect(result).toEqual({ signedIn: false, reason: "email_not_verified" });
      expect(signInCalls).toHaveLength(0);
    });

    it("rejects a callback whose flow state does not match", async () => {
      const result = await useCases.completeGoogleSignIn(CALLBACK, "another-flow-state");

      expect(result).toEqual({ signedIn: false, reason: "state_mismatch" });
      expect(signInCalls).toHaveLength(0);
    });

    it("lets a signInWithIdentity failure propagate", async () => {
      signInError = new Error("database down");

      await expect(
        useCases.completeGoogleSignIn(CALLBACK, FakeOAuthProvider.flowState),
      ).rejects.toThrow("database down");
    });
  });
});
