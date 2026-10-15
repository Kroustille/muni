import { flowCookieValue } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

export async function GET(_request: Request): Promise<Response> {
  const { google } = getServerContainer();
  if (!google) {
    return new Response(null, { status: 404 });
  }

  const { redirectUrl, flowState } = await google.beginGoogleSignIn();
  return new Response(null, {
    status: 307,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": flowCookieValue(flowState),
    },
  });
}
