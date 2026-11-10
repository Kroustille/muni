import type {
  MemoriesGrowthPayload,
  MemoriesGrowthPullResult,
  MemoriesGrowthRemoteStore,
} from "@/application/ports/memories-growth-repositories";
import { RemoteStoreError, type RowError } from "@/application/ports/remote-store";

export function createHttpMemoriesGrowthRemoteStore(deps: {
  fetch: typeof globalThis.fetch;
  baseUrl: string;
}): MemoriesGrowthRemoteStore {
  const joinUrl = (path: string) => `${deps.baseUrl.replace(/\/$/, "")}${path}`;

  async function request(url: string, init?: RequestInit): Promise<unknown> {
    try {
      const response = await deps.fetch(url, { credentials: "include", ...init });
      if (response.status === 401) throw new RemoteStoreError("unauthenticated");
      const text = await response.text();
      const body = text ? JSON.parse(text) : undefined;
      if (response.status === 422) {
        throw new RemoteStoreError("validation", (body as { errors?: RowError[] })?.errors ?? []);
      }
      if (!response.ok) throw new RemoteStoreError("network", [], `HTTP ${response.status}`);
      return body;
    } catch (error) {
      if (error instanceof RemoteStoreError) throw error;
      if (error instanceof TypeError) throw new RemoteStoreError("network");
      throw error;
    }
  }

  return {
    async push(body) {
      return (await request(joinUrl("/api/sync/memories-growth/push"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })) as MemoriesGrowthPayload;
    },

    async pull(since, limit) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (since !== null) params.set("since", since);
      return (await request(
        joinUrl(`/api/sync/memories-growth/pull?${params.toString()}`),
      )) as MemoriesGrowthPullResult;
    },
  };
}
