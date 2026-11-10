import { z } from "zod";

import { resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

const querySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

/**
 * Session cookie only — no Origin check: browsers omit `Origin` on same-origin
 * GETs, which blocked all sync on 2026-11-10 when a pull route checked it.
 */
export async function GET(request: Request): Promise<Response> {
  const { sessions, memoriesGrowthSync } = getServerContainer();
  const userId = await resolveSessionUserId(request, sessions);
  if (userId === null) return new Response(null, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    since: url.searchParams.get("since") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return new Response(null, { status: 400 });

  const result = await memoriesGrowthSync.pull(
    userId,
    parsed.data.since ?? null,
    parsed.data.limit,
  );
  return Response.json(result);
}
