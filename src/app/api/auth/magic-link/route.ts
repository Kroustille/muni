import { z } from "zod";

import { getServerContainer } from "@/app/api/_lib/server-container";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request): Promise<Response> {
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

  const { magicLink } = getServerContainer();
  await magicLink.requestMagicLink(parsed.data.email);
  return Response.json({ ok: true });
}
