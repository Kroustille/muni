"use client";

import { useEffect, useState } from "react";

import type { MusicArtistSearchHit } from "@/application/ports/music-catalog-search";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

import { ExternalLinkActions } from "./external-link-actions";

export type MusicArtistPreviewValues = {
  musicBrainzArtistId: string;
  title: string;
  spotifyUrl: string;
  soundcloudUrl: string;
};

export type MusicArtistCatalogPreviewProps = {
  open: boolean;
  hit: MusicArtistSearchHit;
  onClose: () => void;
  onConfirm: (values: MusicArtistPreviewValues) => void | Promise<void>;
  saving?: boolean;
};

function hitToValues(hit: MusicArtistSearchHit): MusicArtistPreviewValues {
  return {
    musicBrainzArtistId: hit.musicBrainzArtistId,
    title: hit.name,
    spotifyUrl: hit.spotifyUrl ?? "",
    soundcloudUrl: hit.soundcloudUrl ?? "",
  };
}

export function MusicArtistCatalogPreview({
  open,
  hit,
  onClose,
  onConfirm,
  saving = false,
}: MusicArtistCatalogPreviewProps) {
  const [values, setValues] = useState<MusicArtistPreviewValues>(() => hitToValues(hit));

  useEffect(() => {
    if (open) setValues(hitToValues(hit));
  }, [hit, open]);

  return (
    <BottomSheet open={open} onClose={onClose} title={t("music.preview.artist")}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm({ ...values, title: values.title.trim() });
        }}
      >
        <TextField
          label={t("field.name")}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
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
        <ExternalLinkActions
          title={values.title}
          spotifyUrl={values.spotifyUrl}
          soundcloudUrl={values.soundcloudUrl}
        />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            {t("action.cancel")}
          </Button>
          <Button type="submit" className="flex-1" disabled={saving || values.title.trim() === ""}>
            {t("action.save")}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
