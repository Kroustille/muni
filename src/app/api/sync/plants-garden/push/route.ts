import { z } from "zod";

import { isSameOriginRequest, resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { validatePushPlantsGarden } from "@/application/server/plants-garden-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";

const PUSH_MAX = 500;

const bodySchema = z.object({
  plants: z.array(z.unknown()).optional(),
  careEvents: z.array(z.unknown()).optional(),
  careProfiles: z.array(z.unknown()).optional(),
  cultures: z.array(z.unknown()).optional(),
  milestones: z.array(z.unknown()).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, plantsGardenSync } = getServerContainer();
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
    (parsed.data.plants?.length ?? 0) +
    (parsed.data.careEvents?.length ?? 0) +
    (parsed.data.careProfiles?.length ?? 0) +
    (parsed.data.cultures?.length ?? 0) +
    (parsed.data.milestones?.length ?? 0);
  if (total > PUSH_MAX) {
    return Response.json({ errors: [{ message: `batch exceeds ${PUSH_MAX} rows` }] }, { status: 422 });
  }

  try {
    const validated = validatePushPlantsGarden(parsed.data);
    const merged = await plantsGardenSync.push(userId, validated);
    return Response.json(merged);
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
