import { describe, expect, it } from "vitest";

import { itemWireSchema, newItem, updateItem, wireToItem } from "@/domain/item";

const ID = "6f1c1d52-7a53-4a3e-9a47-0d8f6b6f2a11";
const NOW = "2026-01-01T10:00:00.000Z";
const MBID_ARTIST = "53565d2a-ba1c-4e77-9b8a-7a53b4c34512";
const MBID_RECORDING = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

function musicWire(type: "music_artist" | "music_track", overrides: Record<string, unknown> = {}) {
  const base =
    type === "music_artist"
      ? {
          id: ID,
          type: "music_artist",
          title: "Khruangbin",
          created_at: NOW,
          author: null,
          status: null,
          recommended_by: null,
          rating: null,
          notes: null,
          quantity: null,
          checked: false,
          ingredients: null,
          steps: null,
          deleted_at: null,
          fields_updated_at: {},
          isbn: null,
          synopsis: null,
          genres: null,
          publication_year: null,
          publisher: null,
          page_count: null,
          imdb_id: null,
          release_year: null,
          catalog_rating: null,
          media_kind: null,
          artist: null,
          album: null,
          music_brainz_artist_id: MBID_ARTIST,
          music_brainz_recording_id: null,
          spotify_url: "https://open.spotify.com/artist/example",
          soundcloud_url: null,
          server_updated_at: NOW,
        }
      : {
          id: ID,
          type: "music_track",
          title: "Time (You and I)",
          created_at: NOW,
          author: null,
          status: "to_listen",
          recommended_by: null,
          rating: null,
          notes: null,
          quantity: null,
          checked: false,
          ingredients: null,
          steps: null,
          deleted_at: null,
          fields_updated_at: {},
          isbn: null,
          synopsis: null,
          genres: null,
          publication_year: null,
          publisher: null,
          page_count: null,
          imdb_id: null,
          release_year: 2020,
          catalog_rating: null,
          media_kind: null,
          artist: "Khruangbin",
          album: "Mordechai",
          music_brainz_artist_id: null,
          music_brainz_recording_id: MBID_RECORDING,
          spotify_url: null,
          soundcloud_url: "https://soundcloud.com/example/track",
          server_updated_at: NOW,
        };
  return { ...base, ...overrides };
}

describe("music item types", () => {
  it("accepts music_artist with MBID and HTTPS URLs", () => {
    const parsed = itemWireSchema.parse(musicWire("music_artist"));
    expect(parsed.music_brainz_artist_id).toBe(MBID_ARTIST);
    expect(parsed.spotify_url).toContain("https://");
  });

  it("accepts music_track with required artist text", () => {
    const parsed = itemWireSchema.parse(musicWire("music_track"));
    expect(parsed.artist).toBe("Khruangbin");
    expect(parsed.music_brainz_recording_id).toBe(MBID_RECORDING);
  });

  it("rejects music_track without artist", () => {
    expect(itemWireSchema.safeParse(musicWire("music_track", { artist: null })).success).toBe(
      false,
    );
    expect(itemWireSchema.safeParse(musicWire("music_track", { artist: "   " })).success).toBe(
      false,
    );
  });

  it("rejects invalid MusicBrainz ids", () => {
    expect(
      itemWireSchema.safeParse(musicWire("music_artist", { music_brainz_artist_id: "not-uuid" }))
        .success,
    ).toBe(false);
    expect(
      itemWireSchema.safeParse(
        musicWire("music_track", { music_brainz_recording_id: "not-uuid" }),
      ).success,
    ).toBe(false);
  });

  it("rejects non-HTTPS platform URLs", () => {
    expect(
      itemWireSchema.safeParse(musicWire("music_artist", { spotify_url: "http://example.com" }))
        .success,
    ).toBe(false);
  });

  it("accepts optional rating on music_artist", () => {
    const parsed = itemWireSchema.parse(musicWire("music_artist", { rating: 4 }));
    expect(parsed.rating).toBe(4);
  });

  it("defaults music fields on newItem", () => {
    const artist = newItem({ id: ID, type: "music_artist", title: "Artist", createdAt: NOW });
    expect(artist.musicBrainzArtistId).toBeNull();
    expect(artist.rating).toBeNull();
    const track = newItem({
      id: ID,
      type: "music_track",
      title: "Track",
      artist: "Someone",
      createdAt: NOW,
    });
    expect(track.status).toBe("to_listen");
    expect(track.album).toBeNull();
  });

  it("updateItem applies music patches", () => {
    const track = newItem({
      id: ID,
      type: "music_track",
      title: "Track",
      artist: "A",
      createdAt: NOW,
    });
    const next = updateItem(track, {
      status: "listened",
      rating: 5,
      musicBrainzRecordingId: MBID_RECORDING,
    });
    expect(next.status).toBe("listened");
    expect(next.rating).toBe(5);
  });

  it("round-trips music fields through wireToItem", () => {
    const item = wireToItem(itemWireSchema.parse(musicWire("music_track")) as never);
    expect(item.artist).toBe("Khruangbin");
    expect(item.album).toBe("Mordechai");
  });

  it.each([
    ["music_artist", { artist: "X" }],
    ["music_track", { music_brainz_artist_id: MBID_ARTIST }],
    ["book", { music_brainz_recording_id: MBID_RECORDING }],
  ])("rejects cross-type fields on %s", (type, extra) => {
    const wire =
      type === "music_artist"
        ? musicWire("music_artist", { type, ...extra })
        : type === "music_track"
          ? musicWire("music_track", { type, ...extra })
          : musicWire("music_track", {
              type: "book",
              author: "Camus",
              status: "to_read",
              artist: null,
              music_brainz_recording_id: null,
              ...extra,
            });
    expect(itemWireSchema.safeParse(wire).success).toBe(false);
  });
});
