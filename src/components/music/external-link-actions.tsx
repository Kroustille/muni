"use client";

import { openExternalSearch } from "@/application/music/deep-links";
import { t } from "@/i18n";

export type ExternalLinkActionsProps = {
  title: string;
  artist?: string | null;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
};

function openUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ExternalLinkActions({
  title,
  artist,
  spotifyUrl,
  soundcloudUrl,
}: ExternalLinkActionsProps) {
  const query = { title, artist };
  const spotify =
    spotifyUrl != null && spotifyUrl.trim() !== ""
      ? spotifyUrl.trim()
      : openExternalSearch("spotify", query);
  const soundcloud =
    soundcloudUrl != null && soundcloudUrl.trim() !== ""
      ? soundcloudUrl.trim()
      : openExternalSearch("soundcloud", query);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border border-border px-3 py-2 text-sm"
        onClick={() => openUrl(spotify)}
      >
        {spotifyUrl?.trim()
          ? t("music.external.openSpotify")
          : t("music.external.searchSpotify")}
      </button>
      <button
        type="button"
        className="rounded-lg border border-border px-3 py-2 text-sm"
        onClick={() => openUrl(soundcloud)}
      >
        {soundcloudUrl?.trim()
          ? t("music.external.openSoundCloud")
          : t("music.external.searchSoundCloud")}
      </button>
    </div>
  );
}
