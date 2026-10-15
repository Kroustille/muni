export interface OAuthIdentity {
  email: string;
  googleSub: string;
}

export interface OAuthBegin {
  redirectUrl: string;
  /** Opaque state the caller keeps (short-lived HttpOnly cookie) until `complete`. */
  flowState: string;
}

export type OAuthCompletion =
  | { authenticated: true; identity: OAuthIdentity }
  | { authenticated: false; rejected: true; reason: string };

export interface OAuthProvider {
  begin(): Promise<OAuthBegin>;
  complete(
    callbackParams: Readonly<Record<string, string>>,
    flowState: string,
  ): Promise<OAuthCompletion>;
}
