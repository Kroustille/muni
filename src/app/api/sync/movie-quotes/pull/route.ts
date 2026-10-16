import { resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

export async function GET(request: Request): Promise<Response> {
  const { sessions, movieQuoteSync } = getServerContainer();

  const userId = await resolveSessionUserId(request, sessions);
  if (userId === null) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.has("since") ? url.searchParams.get("since") : null;
  const limit = Number(url.searchParams.get("limit") ?? "500");

  const result = await movieQuoteSync.pull(userId, since, limit);
  return Response.json(result);
}
