import { z } from "zod";

import { isSameOriginRequest, resolveSessionUserId } from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { validatePushMusicPractice } from "@/application/server/music-practice-sync-service";
import { SyncValidationError } from "@/application/server/sync-service";

const PUSH_MAX = 500;

const bodySchema = z.object({
  compositions: z.array(z.unknown()).optional(),
  djSets: z.array(z.unknown()).optional(),
  instruments: z.array(z.unknown()).optional(),
  exercises: z.array(z.unknown()).optional(),
  plans: z.array(z.unknown()).optional(),
  logs: z.array(z.unknown()).optional(),
  learningPieces: z.array(z.unknown()).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, musicPracticeSync } = getServerContainer();
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
    (parsed.data.compositions?.length ?? 0) +
    (parsed.data.djSets?.length ?? 0) +
    (parsed.data.instruments?.length ?? 0) +
    (parsed.data.exercises?.length ?? 0) +
    (parsed.data.plans?.length ?? 0) +
    (parsed.data.logs?.length ?? 0) +
    (parsed.data.learningPieces?.length ?? 0);
  if (total > PUSH_MAX) {
    return Response.json({ errors: [{ message: `batch exceeds ${PUSH_MAX} rows` }] }, { status: 422 });
  }

  try {
    const validated = validatePushMusicPractice(parsed.data);
    const merged = await musicPracticeSync.push(userId, validated);
    return Response.json(merged);
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
