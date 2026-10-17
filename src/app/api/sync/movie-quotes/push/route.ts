import { z } from "zod";

import {
  isSameOriginRequest,
  resolveSessionUserId,
} from "@/app/api/_lib/auth-cookies";
import { getServerContainer } from "@/app/api/_lib/server-container";
import { validatePushMovieQuotes } from "@/application/server/movie-quote-sync-service";
import {
  SyncValidationError,
  type RowError,
} from "@/application/server/sync-service";

const SYNC_MOVIE_QUOTES_PUSH_MAX = 500;

const bodySchema = z.object({
  quotes: z.array(z.unknown()),
});

function batchLimitErrors(quotes: unknown[]): RowError[] {
  const errors: RowError[] = [];
  for (let index = SYNC_MOVIE_QUOTES_PUSH_MAX; index < quotes.length; index++) {
    const quote = quotes[index];
    const id =
      quote !== null && typeof quote === "object" && "id" in quote
        ? String((quote as { id: unknown }).id)
        : undefined;
    errors.push({
      index,
      id,
      message: `batch exceeds ${SYNC_MOVIE_QUOTES_PUSH_MAX} quotes`,
    });
  }
  return errors;
}

export async function POST(request: Request): Promise<Response> {
  const { appUrl, sessions, movieQuoteSync } = getServerContainer();

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

  const { quotes } = parsed.data;
  if (quotes.length > SYNC_MOVIE_QUOTES_PUSH_MAX) {
    return Response.json({ errors: batchLimitErrors(quotes) }, { status: 422 });
  }

  try {
    const validated = validatePushMovieQuotes(quotes);
    const merged = await movieQuoteSync.push(userId, validated);
    return Response.json({ quotes: merged });
  } catch (error) {
    if (error instanceof SyncValidationError) {
      return Response.json({ errors: error.rowErrors }, { status: 422 });
    }
    throw error;
  }
}
