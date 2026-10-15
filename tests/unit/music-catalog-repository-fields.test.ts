import { describe, expect, it } from "vitest";

import { newItem } from "@/domain/item";
import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

describe("music catalog fields in ItemRepository", () => {
  it("round-trips music artist and track fields through put/get", async () => {
    const repo = new InMemoryItemRepository();
    const artist = newItem({
      id: "00000000-0000-4000-8000-000000000001",
      type: "music_artist",
      title: "Khruangbin",
      createdAt: "2026-01-01T00:00:00.000Z",
      musicBrainzArtistId: "53565d2a-ba1c-4e77-9b8a-7a53b4c34512",
      spotifyUrl: "https://open.spotify.com/artist/example",
    });
    const track = newItem({
      id: "00000000-0000-4000-8000-000000000002",
      type: "music_track",
      title: "Time (You and I)",
      artist: "Khruangbin",
      createdAt: "2026-01-01T00:00:00.000Z",
      album: "Mordechai",
      musicBrainzRecordingId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
    });
    await repo.put(artist, { enqueue: false });
    await repo.put(track, { enqueue: false });
    expect(await repo.get(artist.id)).toEqual(artist);
    expect(await repo.get(track.id)).toEqual(track);
  });
});
