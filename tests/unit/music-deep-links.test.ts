import { describe, expect, it } from "vitest";

import {
  buildSoundCloudSearchUrl,
  buildSpotifySearchUrl,
  openExternalSearch,
} from "@/application/music/deep-links";

describe("music deep links", () => {
  it("builds Spotify search URL with title only", () => {
    expect(buildSpotifySearchUrl({ title: "Time (You and I)" })).toBe(
      "https://open.spotify.com/search/Time%20(You%20and%20I)",
    );
  });

  it("builds Spotify search URL with artist and title", () => {
    expect(buildSpotifySearchUrl({ title: "Time (You and I)", artist: "Khruangbin" })).toBe(
      "https://open.spotify.com/search/Khruangbin%20Time%20(You%20and%20I)",
    );
  });

  it("builds SoundCloud search URL", () => {
    expect(buildSoundCloudSearchUrl({ title: "Track", artist: "Artist" })).toBe(
      "https://soundcloud.com/search?q=Artist%20Track",
    );
  });

  it("openExternalSearch dispatches by platform", () => {
    expect(openExternalSearch("spotify", { title: "A" })).toContain("open.spotify.com");
    expect(openExternalSearch("soundcloud", { title: "A" })).toContain("soundcloud.com");
  });
});
