import { createRemoteJWKSet, customFetch as joseCustomFetch, jwtVerify } from "jose";
import * as client from "openid-client";
import type {
  OAuthBegin,
  OAuthCompletion,
  OAuthProvider,
} from "../../application/ports/oauth-provider";

export interface GoogleOAuthProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  issuer?: string;
  fetch?: typeof fetch;
}

interface FlowState {
  state: string;
  nonce: string;
  verifier: string;
}

const DEFAULT_ISSUER = "https://accounts.google.com";
const SCOPE = "openid email";

const rejected = (reason: string): OAuthCompletion => ({
  authenticated: false,
  rejected: true,
  reason,
});

function decodeFlowState(raw: string): FlowState | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof value !== "object" || value === null) return null;
    const { state, nonce, verifier } = value as Record<string, unknown>;
    if (typeof state !== "string" || typeof nonce !== "string" || typeof verifier !== "string") {
      return null;
    }
    if (!state || !nonce || !verifier) return null;
    return { state, nonce, verifier };
  } catch {
    return null;
  }
}

export function createGoogleOAuthProvider(options: GoogleOAuthProviderOptions): OAuthProvider {
  const issuer = options.issuer ?? DEFAULT_ISSUER;
  const injected = options.fetch;
  let configPromise: Promise<client.Configuration> | undefined;

  const getConfig = (): Promise<client.Configuration> => {
    configPromise ??= client
      .discovery(
        new URL(issuer),
        options.clientId,
        options.clientSecret,
        undefined,
        injected
          ? { [client.customFetch]: (url, init) => injected(url, init as RequestInit) }
          : undefined,
      )
      .catch((error: unknown) => {
        configPromise = undefined;
        throw error;
      });
    return configPromise;
  };

  return {
    async begin(): Promise<OAuthBegin> {
      const config = await getConfig();
      const verifier = client.randomPKCECodeVerifier();
      const state = client.randomState();
      const nonce = client.randomNonce();
      const url = client.buildAuthorizationUrl(config, {
        redirect_uri: options.redirectUri,
        scope: SCOPE,
        code_challenge: await client.calculatePKCECodeChallenge(verifier),
        code_challenge_method: "S256",
        state,
        nonce,
      });
      const flow: FlowState = { state, nonce, verifier };
      return {
        redirectUrl: url.href,
        flowState: Buffer.from(JSON.stringify(flow), "utf8").toString("base64url"),
      };
    },

    async complete(callbackParams, flowState): Promise<OAuthCompletion> {
      const flow = decodeFlowState(flowState);
      if (!flow) return rejected("invalid flow state");
      if (callbackParams["state"] !== flow.state) return rejected("state mismatch");
      if (callbackParams["error"] || !callbackParams["code"]) {
        return rejected("provider returned an error");
      }

      try {
        const config = await getConfig();
        const callbackUrl = new URL(options.redirectUri);
        for (const [key, value] of Object.entries(callbackParams)) {
          callbackUrl.searchParams.set(key, value);
        }
        const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
          pkceCodeVerifier: flow.verifier,
          expectedState: flow.state,
          expectedNonce: flow.nonce,
          idTokenExpected: true,
        });
        const idToken = tokens.id_token;
        const jwksUri = config.serverMetadata().jwks_uri;
        if (!idToken || !jwksUri) return rejected("missing id token");

        // openid-client v6 does not verify id-token signatures received from the token endpoint.
        const jwks = createRemoteJWKSet(
          new URL(jwksUri),
          injected ? { [joseCustomFetch]: injected } : {},
        );
        const { payload } = await jwtVerify(idToken, jwks, {
          issuer: config.serverMetadata().issuer,
          audience: options.clientId,
          requiredClaims: ["sub", "exp"],
        });

        if (payload["nonce"] !== flow.nonce) return rejected("nonce mismatch");
        const email = payload["email"];
        if (typeof email !== "string" || email.length === 0) return rejected("missing email");
        if (payload["email_verified"] !== true) return rejected("email not verified");
        if (typeof payload.sub !== "string" || payload.sub.length === 0) {
          return rejected("missing subject");
        }
        return { authenticated: true, identity: { email, googleSub: payload.sub } };
      } catch {
        return rejected("authorization code exchange or id token verification failed");
      }
    },
  };
}
