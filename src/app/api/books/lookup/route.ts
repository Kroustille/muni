import { getServerContainer } from "@/app/api/_lib/server-container";
import { resolveSessionFromRequest } from "@/app/api/_lib/auth-cookies";
import { CatalogLookupError } from "@/application/ports/book-catalog-lookup";
import { isValidIsbn } from "@/domain/isbn";

export async function GET(request: Request): Promise<Response> {
  const { sessions, lookupBook } = getServerContainer();
  const session = await resolveSessionFromRequest(request, sessions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(request.url);
  const rawIsbn = url.searchParams.get("isbn");
  if (rawIsbn === null || rawIsbn.trim() === "") {
    return Response.json({ error: "missing_isbn" }, { status: 400 });
  }
  if (!isValidIsbn(rawIsbn)) {
    return Response.json({ error: "invalid_isbn" }, { status: 400 });
  }

  try {
    const hit = await lookupBook(rawIsbn);
    if (hit === null) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(hit);
  } catch (error) {
    if (error instanceof CatalogLookupError) {
      return Response.json({ error: "provider_error" }, { status: 502 });
    }
    throw error;
  }
}
