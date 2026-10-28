import {
  type MusicPracticePullResult,
  type MusicPracticeRemoteStore,
  type MusicPracticeSyncPayload,
} from "@/application/ports/music-practice-remote-store";
import { RemoteStoreError, type RowError } from "@/application/ports/remote-store";

export type { MusicPracticePullResult, MusicPracticeRemoteStore, MusicPracticeSyncPayload };

export function createHttpMusicPracticeRemoteStore(deps: {
  fetch: typeof globalThis.fetch;
  baseUrl: string;
}): MusicPracticeRemoteStore {
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
      const result = await request(joinUrl("/api/sync/music-practice/push"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return result as MusicPracticePullResult;
    },

    async pull(since, limit) {
      const params = new URLSearchParams();
      if (since !== null) params.set("since", since);
      params.set("limit", String(limit));
      const query = params.toString();
      const path = query ? `/api/sync/music-practice/pull?${query}` : "/api/sync/music-practice/pull";
      const result = await request(joinUrl(path));
      return result as MusicPracticePullResult;
    },
  };
}
