export type ExternalSearchQuery = {
  title: string;
  artist?: string | null;
};

function buildQuery({ title, artist }: ExternalSearchQuery): string {
  const trimmedTitle = title.trim();
  const trimmedArtist = artist?.trim() ?? "";
  if (trimmedArtist === "") return trimmedTitle;
  return `${trimmedArtist} ${trimmedTitle}`.trim();
}

export function buildSpotifySearchUrl(input: ExternalSearchQuery): string {
  const query = buildQuery(input);
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export function buildSoundCloudSearchUrl(input: ExternalSearchQuery): string {
  const query = buildQuery(input);
  return `https://soundcloud.com/search?q=${encodeURIComponent(query)}`;
}

export type ExternalPlatform = "spotify" | "soundcloud";

export function openExternalSearch(platform: ExternalPlatform, input: ExternalSearchQuery): string {
  return platform === "spotify" ? buildSpotifySearchUrl(input) : buildSoundCloudSearchUrl(input);
}

/** Fills platform search URLs when catalog hits have no stored link yet (MU1b). */
export function prefillMusicExternalSearchUrls(
  query: ExternalSearchQuery,
  existing?: { spotifyUrl?: string | null; soundcloudUrl?: string | null },
): { spotifyUrl: string; soundcloudUrl: string } {
  const spotify = existing?.spotifyUrl?.trim() ?? "";
  const soundcloud = existing?.soundcloudUrl?.trim() ?? "";
  return {
    spotifyUrl: spotify !== "" ? spotify : buildSpotifySearchUrl(query),
    soundcloudUrl: soundcloud !== "" ? soundcloud : buildSoundCloudSearchUrl(query),
  };
}
