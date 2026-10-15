import { describe, expect, it, vi } from "vitest";

import { createHttpRemoteStore } from "@/adapters/http/remote-store";
import { RemoteStoreError, type ItemWire } from "@/application/ports/remote-store";

const sampleItem: ItemWire = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "book",
  title: "Dune",
  created_at: "2026-01-01T00:00:00.000Z",
  author: null,
  status: "to_read",
  recommended_by: null,
  rating: null,
  notes: null,
  quantity: null,
  checked: false,
  ingredients: null,
  steps: null,
  deleted_at: null,
  fields_updated_at: {},
  server_updated_at: null,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setup(response: Response | Error) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  const store = createHttpRemoteStore({
    fetch: fetch as unknown as typeof globalThis.fetch,
    baseUrl: "https://muni.test",
  });
  return { fetch, store };
}

describe("HTTP RemoteStore adapter", () => {
  it("pushes items with a JSON POST to /api/sync/push", async () => {
    const { fetch, store } = setup(json({ items: [sampleItem] }));
    await store.push([sampleItem]);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://muni.test/api/sync/push");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
    expect(JSON.parse(String(init?.body))).toEqual({ items: [sampleItem] });
  });

  it("pulls with since and limit query parameters", async () => {
    const { fetch, store } = setup(json({ items: [sampleItem], cursor: "2026-01-02T00:00:00.000Z" }));
    await expect(store.pull("2026-01-01T00:00:00.000Z", 50)).resolves.toEqual({
      items: [sampleItem],
      cursor: "2026-01-02T00:00:00.000Z",
    });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://muni.test/api/sync/pull?since=2026-01-01T00%3A00%3A00.000Z&limit=50");
    expect(init?.credentials).toBe("include");
  });

  it("omits the since query parameter when since is null", async () => {
    const { fetch, store } = setup(json({ items: [], cursor: "" }));
    await store.pull(null, 10);
    const [url] = fetch.mock.calls[0]!;
    expect(url).toBe("https://muni.test/api/sync/pull?limit=10");
  });

  it("maps HTTP 401 to an unauthenticated error", async () => {
    const { store } = setup(json({ error: "unauthenticated" }, 401));
    await expect(store.push([sampleItem])).rejects.toMatchObject({ kind: "unauthenticated" });
    await expect(store.pull(null, 10)).rejects.toMatchObject({ kind: "unauthenticated" });
  });

  it("maps HTTP 422 to a validation error with row errors", async () => {
    const rowErrors = [{ index: 0, id: sampleItem.id, message: "invalid" }];
    const { store } = setup(json({ errors: rowErrors }, 422));
    await expect(store.push([sampleItem])).rejects.toMatchObject({
      kind: "validation",
      rowErrors,
    });
  });

  it("maps network failures to a network error", async () => {
    const { store } = setup(new TypeError("failed to fetch"));
    const pushError = await store.push([sampleItem]).catch((error: unknown) => error);
    expect(pushError).toBeInstanceOf(RemoteStoreError);
    expect(pushError).toMatchObject({ kind: "network" });
    const pullError = await store.pull(null, 10).catch((error: unknown) => error);
    expect(pullError).toMatchObject({ kind: "network" });
  });
});
