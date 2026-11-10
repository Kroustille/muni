import { z } from "zod";

import { isSameOriginRequest, resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { validatePushMemoriesGrowth } from "@/application/server/memories-growth-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";

const PUSH_MAX = 500;

const bodySchema = z.object({
  souvenirs: z.array(z.unknown()).optional(),
  goals: z.array(z.unknown()).optional(),
  goalCheckins: z.array(z.unknown()).optional(),
  achievements: z.array(z.unknown()).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, memoriesGrowthSync } = getServerContainer();
  const userId = await resolveSessionUserId(request, sessions);
  if (userId === null) return new Response(null, { status: 401 });
  if (!isSameOriginRequest(request, appUrl)) return new Response(null, { status: 403 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });

  const total =
    (parsed.data.souvenirs?.length ?? 0) +
    (parsed.data.goals?.length ?? 0) +
    (parsed.data.goalCheckins?.length ?? 0) +
    (parsed.data.achievements?.length ?? 0);
  if (total > PUSH_MAX) {
    return Response.json(
      { errors: [{ message: `batch exceeds ${PUSH_MAX} rows` }] },
      { status: 422 },
    );
  }

  try {
    const validated = validatePushMemoriesGrowth(parsed.data);
    return Response.json(await memoriesGrowthSync.push(userId, validated));
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
