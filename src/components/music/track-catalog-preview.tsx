"use client";

import { useEffect, useState } from "react";

import { prefillMusicExternalSearchUrls } from "@/application/music/deep-links";
import type { MusicTrackSearchHit } from "@/application/ports/music-catalog-search";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type MusicTrackPreviewValues = {
  musicBrainzRecordingId: string;
  title: string;
  artist: string;
  album: string;
  releaseYear: string;
  spotifyUrl: string;
  soundcloudUrl: string;
};

export type MusicTrackCatalogPreviewProps = {
  open: boolean;
  hit: MusicTrackSearchHit;
  onClose: () => void;
  onConfirm: (values: MusicTrackPreviewValues) => void | Promise<void>;
  saving?: boolean;
};

function hitToValues(hit: MusicTrackSearchHit): MusicTrackPreviewValues {
  const urls = prefillMusicExternalSearchUrls(
    { title: hit.title, artist: hit.artist },
    { spotifyUrl: hit.spotifyUrl, soundcloudUrl: hit.soundcloudUrl },
  );
  return {
    musicBrainzRecordingId: hit.musicBrainzRecordingId,
    title: hit.title,
    artist: hit.artist,
    album: hit.album ?? "",
    releaseYear: hit.releaseYear !== undefined ? String(hit.releaseYear) : "",
    spotifyUrl: urls.spotifyUrl,
    soundcloudUrl: urls.soundcloudUrl,
  };
}

export function MusicTrackCatalogPreview({
  open,
  hit,
  onClose,
  onConfirm,
  saving = false,
}: MusicTrackCatalogPreviewProps) {
  const [values, setValues] = useState<MusicTrackPreviewValues>(() => hitToValues(hit));

  useEffect(() => {
    if (open) setValues(hitToValues(hit));
  }, [hit, open]);

  return (
    <BottomSheet open={open} onClose={onClose} title={t("music.preview.track")}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (values.artist.trim() === "" || values.title.trim() === "") return;
          void onConfirm({
            ...values,
            title: values.title.trim(),
            artist: values.artist.trim(),
          });
        }}
      >
        <TextField
          label={t("field.title")}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
        <TextField
          label={t("field.artist")}
          value={values.artist}
          onChange={(event) => setValues({ ...values, artist: event.target.value })}
        />
        <TextField
          label={t("field.album")}
          value={values.album}
          onChange={(event) => setValues({ ...values, album: event.target.value })}
        />
        <TextField
          label={t("field.releaseYear")}
          inputMode="numeric"
          value={values.releaseYear}
          onChange={(event) => setValues({ ...values, releaseYear: event.target.value })}
        />
        <TextField
          label={t("field.spotifyUrl")}
          value={values.spotifyUrl}
          onChange={(event) => setValues({ ...values, spotifyUrl: event.target.value })}
        />
        <TextField
          label={t("field.soundcloudUrl")}
          value={values.soundcloudUrl}
          onChange={(event) => setValues({ ...values, soundcloudUrl: event.target.value })}
        />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            {t("action.cancel")}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={saving || values.title.trim() === "" || values.artist.trim() === ""}
          >
            {t("action.save")}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
