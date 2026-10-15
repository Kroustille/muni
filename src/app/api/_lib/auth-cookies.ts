import type { SessionUseCases } from "@/application/auth/sessions";

export const SESSION_COOKIE_NAME = "muni_session";
export const FLOW_COOKIE_NAME = "muni_oauth_flow";

/** Short-lived cookie holding OAuth PKCE / state payload (see auth-api.md). */
export const FLOW_COOKIE_MAX_AGE_SECONDS = 3600;

function cookiesSecure(): boolean {
  return process.env.NODE_ENV !== "development";
}

function cookieAttributes(): string {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (cookiesSecure()) parts.push("Secure");
  return parts.join("; ");
}

export function parseCookies(request: Request): Map<string, string> {
  const header = request.headers.get("cookie");
  const map = new Map<string, string>();
  if (!header) return map;
  for (const segment of header.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return map;
}

export function readCookie(request: Request, name: string): string | undefined {
  return parseCookies(request).get(name);
}

export function sessionCookieValue(token: string, expiresAt: Date): string {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return `${SESSION_COOKIE_NAME}=${token}; ${cookieAttributes()}; Max-Age=${maxAge}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; ${cookieAttributes()}; Max-Age=0`;
}

export function flowCookieValue(flowState: string): string {
  return `${FLOW_COOKIE_NAME}=${flowState}; ${cookieAttributes()}; Max-Age=${FLOW_COOKIE_MAX_AGE_SECONDS}`;
}

export function clearedFlowCookie(): string {
  return `${FLOW_COOKIE_NAME}=; ${cookieAttributes()}; Max-Age=0`;
}

export function absoluteRedirectUrl(appUrl: string, path: string): string {
  const base = appUrl.endsWith("/") ? appUrl : `${appUrl}/`;
  return new URL(path.replace(/^\//, ""), base).href;
}

export function redirectResponse(appUrl: string, path: string, init?: { cookies?: string[] }): Response {
  const headers = new Headers({ Location: absoluteRedirectUrl(appUrl, path) });
  for (const cookie of init?.cookies ?? []) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 307, headers });
}

export function isSameOriginRequest(request: Request, appUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

export async function resolveSessionFromRequest(
  request: Request,
  sessions: SessionUseCases,
): Promise<{ userId: string; email: string } | null> {
  const token = readCookie(request, SESSION_COOKIE_NAME);
  if (token === undefined) return null;
  return sessions.validateSession(token);
}

export async function resolveSessionUserId(
  request: Request,
  sessions: SessionUseCases,
): Promise<string | null> {
  const session = await resolveSessionFromRequest(request, sessions);
  return session?.userId ?? null;
}
