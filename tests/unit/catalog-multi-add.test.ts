import { describe, expect, it } from "vitest";

import { runCatalogMultiAdd } from "@/application/catalog/catalog-multi-add";

describe("runCatalogMultiAdd", () => {
  it("runs sequential adds and collects failures", async () => {
    const items = [
      { key: "1", title: "OK" },
      { key: "2", title: "Fail" },
      { key: "3", title: "OK2" },
    ];
    const result = await runCatalogMultiAdd(items, async (item) => {
      if (item.key === "2") throw new Error("boom");
    });
    expect(result.succeeded.map((i) => i.key)).toEqual(["1", "3"]);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.title).toBe("Fail");
  });
});
