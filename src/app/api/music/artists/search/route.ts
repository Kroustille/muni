import { getServerContainer } from "@/app/api/_lib/server-container";
import { resolveSessionFromRequest } from "@/app/api/_lib/auth-cookies";
import { MusicCatalogSearchError } from "@/application/ports/music-catalog-search";

export async function GET(request: Request): Promise<Response> {
  const { sessions, searchMusicArtists } = getServerContainer();
  const session = await resolveSessionFromRequest(request, sessions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q");
  if (rawQuery === null || rawQuery.trim() === "") {
    return Response.json({ error: "missing_query" }, { status: 400 });
  }

  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? undefined : Number.parseInt(rawLimit, 10);

  try {
    const results = await searchMusicArtists(
      rawQuery,
      Number.isFinite(limit) ? limit : undefined,
    );
    return Response.json({ results });
  } catch (error) {
    if (error instanceof MusicCatalogSearchError) {
      return Response.json({ error: "provider_error" }, { status: 502 });
    }
    throw error;
  }
}
