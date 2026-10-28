import { describe, expect, it } from "vitest";

import { updateItem } from "@/domain/item";
import { buildRecapSnapshot } from "@/application/recap/build-recap-snapshot";
import { makeItem } from "../../helpers/item-repository.contract";
import { createRecapTestDeps } from "./recap-fixtures";

describe("buildRecapSnapshot", () => {
  it("groups by domain, sorts newest first, omits empty sections", async () => {
    const deps = createRecapTestDeps();
    await deps.items.put(
      updateItem(makeItem({ type: "book", status: "read", title: "Alpha" }), {
        fieldsUpdatedAt: { read: "2026-03-10T10:00:00.000Z" },
      }),
      { enqueue: false },
    );
    await deps.items.put(
      updateItem(makeItem({ type: "book", status: "read", title: "Beta" }), {
        fieldsUpdatedAt: { read: "2026-03-15T10:00:00.000Z" },
      }),
      { enqueue: false },
    );
    const snapshot = await buildRecapSnapshot({
      period: { granularity: "month", anchorDate: "2026-03-15", timeZone: "Europe/Paris" },
      deps,
      todayDateKey: "2026-03-20",
    });
    expect(snapshot.sections).toHaveLength(1);
    expect(snapshot.sections[0].achievements[0].title).toBe("Beta");
    expect(snapshot.totalCount).toBe(2);
  });

  it("books-only fixture yields single section (US6)", async () => {
    const deps = createRecapTestDeps();
    await deps.items.put(
      updateItem(makeItem({ type: "book", status: "read" }), {
        fieldsUpdatedAt: { read: "2026-03-10T10:00:00.000Z" },
      }),
      { enqueue: false },
    );
    const snapshot = await buildRecapSnapshot({
      period: { granularity: "week", anchorDate: "2026-03-10", timeZone: "Europe/Paris" },
      deps,
      todayDateKey: "2026-03-10",
    });
    expect(snapshot.sections.map((section) => section.domainId)).toEqual(["book"]);
  });

  it("excludes soft-deleted sources", async () => {
    const deps = createRecapTestDeps();
    await deps.items.put(
      updateItem(makeItem({ type: "book", status: "read" }), {
        deletedAt: "2026-03-01T00:00:00.000Z",
        fieldsUpdatedAt: { read: "2026-03-10T10:00:00.000Z" },
      }),
      { enqueue: false },
    );
    const snapshot = await buildRecapSnapshot({
      period: { granularity: "month", anchorDate: "2026-03-15", timeZone: "Europe/Paris" },
      deps,
      todayDateKey: "2026-03-15",
    });
    expect(snapshot.empty).toBe(true);
  });

  it("handles fifty events in one month under 2s (SC-001)", async () => {
    const deps = createRecapTestDeps();
    for (let index = 0; index < 50; index += 1) {
      const day = String((index % 28) + 1).padStart(2, "0");
      await deps.items.put(
        makeItem({
          type: "recipe",
          status: null,
          title: `Recipe ${index}`,
          cookedDates: [`2026-04-${day}`],
        }),
        { enqueue: false },
      );
    }
    const started = performance.now();
    const snapshot = await buildRecapSnapshot({
      period: { granularity: "month", anchorDate: "2026-04-15", timeZone: "Europe/Paris" },
      deps,
      todayDateKey: "2026-04-30",
    });
    expect(performance.now() - started).toBeLessThan(2000);
    expect(snapshot.totalCount).toBe(50);
  });
});
