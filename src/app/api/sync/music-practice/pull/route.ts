import { z } from "zod";

import { resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";

const querySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export async function GET(request: Request): Promise<Response> {
  const { sessions, musicPracticeSync } = getServerContainer();
  const userId = await resolveSessionUserId(request, sessions);
  if (userId === null) return new Response(null, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    since: url.searchParams.get("since") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return new Response(null, { status: 400 });

  const since = parsed.data.since ?? null;
  const result = await musicPracticeSync.pull(userId, since, parsed.data.limit);
  return Response.json(result);
}
