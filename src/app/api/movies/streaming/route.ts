import { getServerContainer } from "@/app/api/_lib/server-container";
import { resolveSessionFromRequest } from "@/app/api/_lib/auth-cookies";

export async function GET(request: Request): Promise<Response> {
  const { sessions, lookupMovieStreaming } = getServerContainer();
  const session = await resolveSessionFromRequest(request, sessions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(request.url);
  const imdbId = url.searchParams.get("imdbId");
  if (imdbId === null || imdbId.trim() === "") {
    return Response.json({ error: "missing_imdb_id" }, { status: 400 });
  }

  const providers = await lookupMovieStreaming(imdbId.trim());
  return Response.json({ providers });
}
