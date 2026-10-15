import {
  redirectResponse,
  sessionCookieValue,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

export async function GET(request: Request): Promise<Response> {
  const { appUrl, magicLink, sessions } = getServerContainer();
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const identity = await magicLink.verifyMagicLink(token);
  if (!identity) {
    return redirectResponse(appUrl, "/sign-in?error=invalid_link");
  }

  const { sessionToken, expiresAt } = await sessions.signInWithIdentity({
    email: identity.email,
  });

  return redirectResponse(appUrl, "/", {
    cookies: [sessionCookieValue(sessionToken, expiresAt)],
  });
}
