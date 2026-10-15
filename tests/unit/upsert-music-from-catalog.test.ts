import { beforeEach, describe, expect, it } from "vitest";

import { createItemUseCases } from "@/application/items";

import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";

const DEVICE = "device-a";
const T0 = Date.parse("2026-01-01T10:00:00.000Z");
const MBID_ARTIST = "53565d2a-ba1c-4e77-9b8a-7a53b4c34512";
const MBID_RECORDING = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

function setup() {
  const repository = new InMemoryItemRepository();
  let counter = 0;
  const useCases = createItemUseCases({
    repository,
    idGenerator: { newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}` },
    now: () => T0,
  });
  return { repository, useCases };
}

let ctx: ReturnType<typeof setup>;

beforeEach(async () => {
  ctx = setup();
  await ctx.repository.meta.set("deviceId", DEVICE);
});

describe("upsertMusicArtistFromCatalog", () => {
  it("updates an active artist with the same MBID silently", async () => {
    const existing = await ctx.useCases.createItem("music_artist", "Old", {
      musicBrainzArtistId: MBID_ARTIST,
    });
    const saved = await ctx.useCases.upsertMusicArtistFromCatalog({
      musicBrainzArtistId: MBID_ARTIST,
      title: "Khruangbin",
    });
    expect(saved.id).toBe(existing.id);
    expect(saved.title).toBe("Khruangbin");
  });

  it("restores a soft-deleted artist on the same MBID", async () => {
    const existing = await ctx.useCases.createItem("music_artist", "Khruangbin", {
      musicBrainzArtistId: MBID_ARTIST,
    });
    await ctx.useCases.deleteItem(existing.id);
    const saved = await ctx.useCases.upsertMusicArtistFromCatalog({
      musicBrainzArtistId: MBID_ARTIST,
      title: "Khruangbin",
    });
    expect(saved.id).toBe(existing.id);
    expect(saved.deletedAt).toBeNull();
  });
});

describe("upsertMusicTrackFromCatalog", () => {
  it("merges into a manual track when title and artist match", async () => {
    const manual = await ctx.useCases.createItem("music_track", "Time", {
      artist: "Khruangbin",
    });
    const saved = await ctx.useCases.upsertMusicTrackFromCatalog({
      musicBrainzRecordingId: MBID_RECORDING,
      title: "Time (You and I)",
      artist: "Khruangbin",
    });
    expect(saved.id).toBe(manual.id);
    expect(saved.musicBrainzRecordingId).toBe(MBID_RECORDING);
  });

  it("restores a soft-deleted track on the same recording MBID", async () => {
    const existing = await ctx.useCases.createItem("music_track", "Time", {
      artist: "Khruangbin",
      musicBrainzRecordingId: MBID_RECORDING,
    });
    await ctx.useCases.deleteItem(existing.id);
    const saved = await ctx.useCases.upsertMusicTrackFromCatalog({
      musicBrainzRecordingId: MBID_RECORDING,
      title: "Time (You and I)",
      artist: "Khruangbin",
    });
    expect(saved.id).toBe(existing.id);
    expect(saved.deletedAt).toBeNull();
  });
});
