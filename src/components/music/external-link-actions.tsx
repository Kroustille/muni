"use client";

import { t } from "@/i18n";

export type ExternalLinkActionsProps = {
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
};

function openUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ExternalLinkActions({ spotifyUrl, soundcloudUrl }: ExternalLinkActionsProps) {
  const spotify = spotifyUrl?.trim() ?? "";
  const soundcloud = soundcloudUrl?.trim() ?? "";
  if (spotify === "" && soundcloud === "") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {spotify !== "" ? (
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() => openUrl(spotify)}
        >
          {t("music.external.openSpotify")}
        </button>
      ) : null}
      {soundcloud !== "" ? (
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() => openUrl(soundcloud)}
        >
          {t("music.external.openSoundCloud")}
        </button>
      ) : null}
    </div>
  );
}
