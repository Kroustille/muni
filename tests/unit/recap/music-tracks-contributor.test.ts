import { describe, expect, it } from "vitest";

import { updateItem } from "@/domain/item";
import { musicTracksRecapContributor } from "@/application/recap/contributors/music-tracks-contributor";
import { makeItem } from "../../helpers/item-repository.contract";
import { createRecapTestDeps } from "./recap-fixtures";

describe("musicTracksRecapContributor", () => {
  it("emits listened tracks", async () => {
    const deps = createRecapTestDeps();
    const track = updateItem(
      makeItem({
        type: "music_track",
        status: "listened",
        artist: "Artist",
      }),
      { fieldsUpdatedAt: { status: "2026-05-01T14:00:00.000Z" } },
    );
    await deps.items.put(track, { enqueue: false });
    const rows = await musicTracksRecapContributor.collectAchievements(deps, {
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      timeZone: "Europe/Paris",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].musicLineKind).toBe("listened");
  });
});
