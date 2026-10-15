import { describe, expect, it } from "vitest";

import { formatArtistCredit } from "@/adapters/musicbrainz/format-artist-credit";

describe("formatArtistCredit", () => {
  it("joins credited names and join phrases", () => {
    expect(
      formatArtistCredit([
        { name: "Queen" },
        { joinphrase: " & ", name: "David Bowie" },
      ]),
    ).toBe("Queen & David Bowie");
  });

  it("falls back to nested artist name", () => {
    expect(formatArtistCredit([{ artist: { name: "Khruangbin" } }])).toBe("Khruangbin");
  });
});
