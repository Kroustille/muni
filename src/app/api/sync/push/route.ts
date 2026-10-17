import { z } from "zod";

import {
  isSameOriginRequest,
  resolveSessionUserId,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import {
  SyncValidationError,
  validatePushItems,
  type RowError,
} from "@/application/server/sync-service";

<<<<<<< HEAD
/** Must match `SYNC_PUSH_MAX_ITEMS` in `tests/integration/sync-routes.test.ts`. */
=======
/** Must match `SYNC_PUSH_MAX_ITEMS` (500) in `tests/integration/sync-routes.test.ts`. */
>>>>>>> 8d4ded8 (feat(deploy): production Docker image, Compose, and GHCR CI)
const SYNC_PUSH_MAX_ITEMS = 500;

const bodySchema = z.object({
  items: z.array(z.unknown()),
});

function batchLimitErrors(items: unknown[]): RowError[] {
  const errors: RowError[] = [];
  for (let index = SYNC_PUSH_MAX_ITEMS; index < items.length; index++) {
    const item = items[index];
    const id =
      item !== null && typeof item === "object" && "id" in item
        ? String((item as { id: unknown }).id)
        : undefined;
    errors.push({
      index,
      id,
      message: `batch exceeds ${SYNC_PUSH_MAX_ITEMS} items`,
    });
  }
  return errors;
}

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, sync } = getServerContainer();

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

  const { items } = parsed.data;
  if (items.length > SYNC_PUSH_MAX_ITEMS) {
    return Response.json({ errors: batchLimitErrors(items) }, { status: 422 });
  }

  try {
    const validated = validatePushItems(items);
    const merged = await sync.push(userId, validated);
    return Response.json({ items: merged });
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
