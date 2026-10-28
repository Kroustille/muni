import { z } from "zod";

import {
  isSameOriginRequest,
  resolveSessionUserId,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { validatePushCookbooks } from "@/application/server/cookbook-sync-service";
import {
  SyncValidationError,
  type RowError,
} from "@/application/server/sync-service";

const SYNC_COOKBOOKS_PUSH_MAX = 500;

const bodySchema = z.object({
  cookbooks: z.array(z.unknown()),
});

function batchLimitErrors(cookbooks: unknown[]): RowError[] {
  const errors: RowError[] = [];
  for (let index = SYNC_COOKBOOKS_PUSH_MAX; index < cookbooks.length; index++) {
    const cookbook = cookbooks[index];
    const id =
      cookbook !== null && typeof cookbook === "object" && "id" in cookbook
        ? String((cookbook as { id: unknown }).id)
        : undefined;
    errors.push({
      index,
      id,
      message: `batch exceeds ${SYNC_COOKBOOKS_PUSH_MAX} cookbooks`,
    });
  }
  return errors;
}

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, cookbookSync } = getServerContainer();

  const userId = await resolveSessionUserId(request, sessions);
  if (userId === null) {
    return new Response(null, { status: 401 });
  }

  if (!isSameOriginRequest(request, appUrl)) {
    return new Response(null, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const { cookbooks } = parsed.data;
  if (cookbooks.length > SYNC_COOKBOOKS_PUSH_MAX) {
    return Response.json({ errors: batchLimitErrors(cookbooks) }, { status: 422 });
  }

  try {
    const validated = validatePushCookbooks(cookbooks);
    const merged = await cookbookSync.push(userId, validated);
    return Response.json({ cookbooks: merged });
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
