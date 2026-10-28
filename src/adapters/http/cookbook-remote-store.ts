import type { CookbookWire } from "@/domain/cookbook";
import type { CookbookRemoteStore } from "@/application/ports/cookbook-remote-store";
import {
  RemoteStoreError,
  type RowError,
} from "@/application/ports/remote-store";

export type HttpCookbookRemoteStoreDeps = {
  fetch: typeof globalThis.fetch;
  baseUrl: string;
};

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function validationError(body: unknown): RemoteStoreError {
  const rowErrors = (body as { errors?: RowError[] } | undefined)?.errors ?? [];
  return new RemoteStoreError("validation", rowErrors);
}

export function createHttpCookbookRemoteStore(
  deps: HttpCookbookRemoteStoreDeps,
): CookbookRemoteStore {
  const { fetch, baseUrl } = deps;

  async function request(url: string, init: RequestInit): Promise<unknown> {
    try {
      const response = await fetch(url, init);
      if (response.status === 401) {
        throw new RemoteStoreError("unauthenticated");
      }
      const body = await readJson(response);
      if (response.status === 422) {
        throw validationError(body);
      }
      if (!response.ok) {
        throw new RemoteStoreError("network", [], `HTTP ${response.status}`);
      }
      return body;
    } catch (error) {
      if (error instanceof RemoteStoreError) throw error;
      if (isNetworkFailure(error)) throw new RemoteStoreError("network");
      throw error;
    }
  }

  return {
    async push(cookbooks: CookbookWire[]): Promise<CookbookWire[]> {
      const body = await request(joinUrl(baseUrl, "/api/sync/cookbooks/push"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cookbooks }),
        credentials: "include",
      });
      return (body as { cookbooks: CookbookWire[] }).cookbooks;
    },

    async pull(since: string | null, limit: number) {
      const params = new URLSearchParams();
      if (since !== null) params.set("since", since);
      params.set("limit", String(limit));
      const query = params.toString();
      const path = query ? `/api/sync/cookbooks/pull?${query}` : "/api/sync/cookbooks/pull";
      const body = await request(joinUrl(baseUrl, path), {
        credentials: "include",
      });
      const parsed = body as { cookbooks: CookbookWire[]; cursor: string };
      return { cookbooks: parsed.cookbooks, cursor: parsed.cursor };
    },
  };
}
