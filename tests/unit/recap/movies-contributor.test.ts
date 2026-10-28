import { describe, expect, it } from "vitest";

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
});
