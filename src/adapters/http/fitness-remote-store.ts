import type { FitnessProgramWire } from "@/domain/fitness/program";
import type {
  FitnessSkipRecordWire,
  FitnessUserSettingsWire,
  FitnessWorkoutLogWire,
} from "@/domain/fitness/workout-log";
import { RemoteStoreError, type RowError } from "@/application/ports/remote-store";

export type FitnessPullResult = {
  programs: FitnessProgramWire[];
  workoutLogs: FitnessWorkoutLogWire[];
  skipRecords: FitnessSkipRecordWire[];
  settings: FitnessUserSettingsWire[];
  cursor: string;
};

export type FitnessRemoteStore = {
  push(body: {
    programs: FitnessProgramWire[];
    workoutLogs: FitnessWorkoutLogWire[];
    skipRecords: FitnessSkipRecordWire[];
    settings: FitnessUserSettingsWire[];
  }): Promise<FitnessPullResult>;
  pull(since: string | null, limit: number): Promise<FitnessPullResult>;
};

export function createHttpFitnessRemoteStore(deps: {
  fetch: typeof globalThis.fetch;
  baseUrl: string;
}): FitnessRemoteStore {
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
      const result = await request(joinUrl("/api/sync/fitness/push"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return result as FitnessPullResult;
    },

    async pull(since, limit) {
      const params = new URLSearchParams();
      if (since !== null) params.set("since", since);
      params.set("limit", String(limit));
      const query = params.toString();
      const path = query ? `/api/sync/fitness/pull?${query}` : "/api/sync/fitness/pull";
      const result = await request(joinUrl(path));
      return result as FitnessPullResult;
    },
  };
}
