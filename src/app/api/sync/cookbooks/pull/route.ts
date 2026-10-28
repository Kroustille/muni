import { z } from "zod";

import {
  isSameOriginRequest,
  resolveSessionUserId,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { SyncAuthError } from "@/application/server/sync-service";

const querySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(request: Request): Promise<Response> {
  const { appUrl, sessions, cookbookSync } = getServerContainer();

  const userId = await resolveSessionUserId(request, sessions);
  if (userId === null) {
    return new Response(null, { status: 401 });
  }

  if (!isSameOriginRequest(request, appUrl)) {
    return new Response(null, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const since = parsed.data.since ?? null;
  const limit = parsed.data.limit ?? 500;

  try {
    const page = await cookbookSync.pull(userId, since, limit);
    return Response.json(page);
  } catch (error) {
    if (error instanceof SyncAuthError) {
      return new Response(null, { status: 401 });
    }
    throw error;
  }
}
