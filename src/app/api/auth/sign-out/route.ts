import {
  clearedSessionCookie,
  isSameOriginRequest,
  readCookie,
  SESSION_COOKIE_NAME,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions } = getServerContainer();
  if (!isSameOriginRequest(request, appUrl)) {
    return new Response(null, { status: 403 });
  }

  const token = readCookie(request, SESSION_COOKIE_NAME);
  if (token !== undefined) {
    await sessions.signOut(token);
  }

  return new Response(null, {
    status: 200,
    headers: { "Set-Cookie": clearedSessionCookie() },
  });
}
