import { z } from "zod";

import { isSameOriginRequest, resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { validatePushFitness } from "@/application/server/fitness-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";

const PUSH_MAX = 500;

const bodySchema = z.object({
  sessionTemplates: z.array(z.unknown()).optional(),
  scheduledSessions: z.array(z.unknown()).optional(),
  workoutLogs: z.array(z.unknown()).optional(),
  skipRecords: z.array(z.unknown()).optional(),
  settings: z.array(z.unknown()).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, fitnessSync } = getServerContainer();
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
    (parsed.data.sessionTemplates?.length ?? 0) +
    (parsed.data.scheduledSessions?.length ?? 0) +
    (parsed.data.workoutLogs?.length ?? 0) +
    (parsed.data.skipRecords?.length ?? 0) +
    (parsed.data.settings?.length ?? 0);
  if (total > PUSH_MAX) {
    return Response.json({ errors: [{ message: `batch exceeds ${PUSH_MAX} rows` }] }, { status: 422 });
  }

  try {
    const validated = validatePushFitness(parsed.data);
    const merged = await fitnessSync.push(userId, validated);
    return Response.json(merged);
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
