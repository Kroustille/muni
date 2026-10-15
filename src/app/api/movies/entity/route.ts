import { getServerContainer } from "@/app/api/_lib/server-container";
import { resolveSessionFromRequest } from "@/app/api/_lib/auth-cookies";
import { MovieCatalogSearchError } from "@/application/ports/movie-catalog-search";

export async function GET(request: Request): Promise<Response> {
  const { sessions, fetchMovieCatalogDetail } = getServerContainer();
  const session = await resolveSessionFromRequest(request, sessions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id === null || id.trim() === "") {
    return Response.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const detail = await fetchMovieCatalogDetail(id);
    if (detail === null) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(detail);
  } catch (error) {
    if (error instanceof MovieCatalogSearchError) {
      return Response.json({ error: "provider_error" }, { status: 502 });
    }
    throw error;
  }
}
