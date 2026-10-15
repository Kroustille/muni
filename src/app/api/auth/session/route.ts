import { getServerContainer } from "@/app/api/_lib/server-container";
import { resolveSessionFromRequest } from "@/app/api/_lib/auth-cookies";

export async function GET(request: Request): Promise<Response> {
  const { sessions } = getServerContainer();
  const session = await resolveSessionFromRequest(request, sessions);
  if (!session) {
    return new Response(null, { status: 401 });
  }
  return Response.json({ userId: session.userId, email: session.email });
}
