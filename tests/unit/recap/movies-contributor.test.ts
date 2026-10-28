import { describe, expect, it } from "vitest";

import { updateItem } from "@/domain/item";
import { moviesRecapContributor } from "@/application/recap/contributors/movies-contributor";
import { makeItem } from "../../helpers/item-repository.contract";
import { createRecapTestDeps } from "./recap-fixtures";

describe("moviesRecapContributor", () => {
  it("emits episode lines per watchedAt", async () => {
    const deps = createRecapTestDeps();
    const movie = makeItem({
      type: "movie",
      status: "in_progress",
      mediaKind: "series",
      episodeProgress: {
        S1E1: { watchedAt: "2026-04-02" },
        S1E2: { watchedAt: "2026-04-03" },
      },
    });
    await deps.items.put(movie, { enqueue: false });
    const rows = await moviesRecapContributor.collectAchievements(deps, {
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(2);
  });

  it("handles HLC fieldsUpdatedAt.watched stamps", async () => {
    const deps = createRecapTestDeps();
    const wallMs = Date.UTC(2026, 3, 5, 18, 0, 0);
    const movie = updateItem(makeItem({ type: "movie", status: "watched", watchedAt: "2026-04-05" }), {
      fieldsUpdatedAt: { watched: `${wallMs}-0-device`, status: `${wallMs}-1-device` },
    });
    await deps.items.put(movie, { enqueue: false });
    const rows = await moviesRecapContributor.collectAchievements(deps, {
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      timeZone: "Europe/Paris",
    });
    expect(rows.some((row) => row.occurredOn === "2026-04-05")).toBe(true);
  });
});
