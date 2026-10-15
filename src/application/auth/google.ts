import type { OAuthIdentity, OAuthProvider } from "../ports/oauth-provider";

export interface SignedInSession {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
}

export type SignInWithIdentity = (identity: OAuthIdentity) => Promise<SignedInSession>;

export type GoogleSignInResult =
  | { signedIn: true; session: SignedInSession }
  | { signedIn: false; reason: string };

export interface GoogleDeps {
  oauth: OAuthProvider;
  signInWithIdentity: SignInWithIdentity;
}

export interface GoogleUseCases {
  beginGoogleSignIn(): Promise<{ redirectUrl: string; flowState: string }>;
  completeGoogleSignIn(
    callbackParams: Readonly<Record<string, string>>,
    flowState: string,
  ): Promise<GoogleSignInResult>;
}

export function createGoogleUseCases(deps: GoogleDeps): GoogleUseCases {
  return {
    beginGoogleSignIn: () => deps.oauth.begin(),

    async completeGoogleSignIn(callbackParams, flowState) {
      const completion = await deps.oauth.complete(callbackParams, flowState);
      if (!completion.authenticated) return { signedIn: false, reason: completion.reason };
      const session = await deps.signInWithIdentity(completion.identity);
      return { signedIn: true, session };
    },
  };
}
