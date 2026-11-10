import { describe, expect, it } from "vitest";

import { deterministicUuid, MEMORIES_NAMESPACE } from "@/domain/deterministic-uuid";

const NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("deterministicUuid (RFC 4122 v5)", () => {
  it("matches reference vectors", async () => {
    expect(await deterministicUuid(NAMESPACE_DNS, "python.org")).toBe(
      "886313e1-3b8a-5372-9b90-0c9aee199e5d",
    );
    expect(await deterministicUuid(NAMESPACE_DNS, "www.example.com")).toBe(
      "2ed6657d-e927-568b-95e1-2665a8aea6a2",
    );
  });

  it("is stable and sets version 5 / RFC variant", async () => {
    const a = await deterministicUuid(MEMORIES_NAMESPACE, "books_read:10");
    const b = await deterministicUuid(MEMORIES_NAMESPACE, "books_read:10");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("differs per name", async () => {
    expect(await deterministicUuid(MEMORIES_NAMESPACE, "books_read:10")).not.toBe(
      await deterministicUuid(MEMORIES_NAMESPACE, "books_read:25"),
    );
  });

  it("rejects a malformed namespace", async () => {
    await expect(deterministicUuid("not-a-uuid", "x")).rejects.toThrow();
  });
});
