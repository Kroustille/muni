/** Liveness probe for Docker Compose and reverse proxies (no auth). */
export async function GET(): Promise<Response> {
  return Response.json({ status: "ok" });
}
