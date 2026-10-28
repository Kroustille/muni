import { describe, expect, it } from "vitest";

import { updateItem } from "@/domain/item";
import { booksRecapContributor } from "@/application/recap/contributors/books-contributor";
import { makeItem } from "../../helpers/item-repository.contract";
import { createRecapTestDeps } from "./recap-fixtures";

describe("booksRecapContributor", () => {
  it("emits read books in range", async () => {
    const deps = createRecapTestDeps();
    const book = updateItem(makeItem({ type: "book", status: "read" }), {
      fieldsUpdatedAt: { read: "2026-03-10T10:00:00.000Z" },
    });
    await deps.items.put(book, { enqueue: false });
    const rows = await booksRecapContributor.collectAchievements(deps, {
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].occurredOn).toBe("2026-03-10");
  });

  it("skips soft-deleted books", async () => {
    const deps = createRecapTestDeps();
    const book = updateItem(makeItem({ type: "book", status: "read" }), {
      deletedAt: "2026-03-01T00:00:00.000Z",
      fieldsUpdatedAt: { read: "2026-03-10T10:00:00.000Z" },
    });
    await deps.items.put(book, { enqueue: false });
    const rows = await booksRecapContributor.collectAchievements(deps, {
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(0);
  });

  it("maps HLC read stamps to calendar days", async () => {
    const deps = createRecapTestDeps();
    const wallMs = Date.UTC(2026, 2, 10, 12, 0, 0);
    const book = updateItem(makeItem({ type: "book", status: "read" }), {
      fieldsUpdatedAt: { read: `${wallMs}-0-device` },
    });
    await deps.items.put(book, { enqueue: false });
    const rows = await booksRecapContributor.collectAchievements(deps, {
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].occurredOn).toBe("2026-03-10");
  });
});
