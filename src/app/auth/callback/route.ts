import {
  clearedFlowCookie,
  FLOW_COOKIE_NAME,
  readCookie,
  redirectResponse,
  sessionCookieValue,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

function callbackParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export async function GET(request: Request): Promise<Response> {
  const { appUrl, google } = getServerContainer();
  if (!google) {
    return redirectResponse(appUrl, "/sign-in?error=google_unavailable");
  }

  const flowState = readCookie(request, FLOW_COOKIE_NAME);
  if (flowState === undefined) {
    return redirectResponse(appUrl, "/sign-in?error=google_failed");
  }

  const url = new URL(request.url);
  const result = await google.completeGoogleSignIn(callbackParams(url), flowState);
  if (!result.signedIn) {
    return redirectResponse(appUrl, "/sign-in?error=google_failed", {
      cookies: [clearedFlowCookie()],
    });
  }

  const { sessionToken, expiresAt } = result.session;
  return redirectResponse(appUrl, "/", {
    cookies: [sessionCookieValue(sessionToken, expiresAt), clearedFlowCookie()],
  });
}
