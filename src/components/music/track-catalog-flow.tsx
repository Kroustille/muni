"use client";

import { useCallback, useEffect, useState } from "react";

import { searchMusicTracksCatalog } from "@/application/music/fetch-music-catalog";
import type { MusicTrackSearchHit } from "@/application/ports/music-catalog-search";
import { getItemUseCases } from "@/composition/client";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useDebouncedSearch } from "@/components/use-debounced-search";
import { useOnline } from "@/components/use-online";
import { t } from "@/i18n";

import { MusicTrackCatalogPreview, type MusicTrackPreviewValues } from "./track-catalog-preview";

export type MusicTrackCatalogFlowProps = {
  onSaved?: () => void;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function MusicTrackCatalogFlow({ onSaved }: MusicTrackCatalogFlowProps) {
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MusicTrackSearchHit[]>([]);
  const [previewHit, setPreviewHit] = useState<MusicTrackSearchHit | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setQuery("");
    setLoading(false);
    setError(null);
    setResults([]);
    setPreviewHit(null);
    setSaving(false);
  }, []);

  const runSearch = useCallback(async () => {
    if (!online) return;
    const trimmed = query.trim();
    if (trimmed === "") return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const hits = await searchMusicTracksCatalog(trimmed);
      setResults(hits);
      if (hits.length === 0) setError(t("music.catalog.empty"));
    } catch {
      setError(t("music.catalog.error"));
    } finally {
      setLoading(false);
    }
  }, [online, query]);

  useDebouncedSearch(query, open && online, runSearch);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setError(null);
    }
  }, [query]);

  const confirmSave = useCallback(
    async (values: MusicTrackPreviewValues) => {
      setSaving(true);
      try {
        const useCases = await getItemUseCases();
        await useCases.upsertMusicTrackFromCatalog({
          musicBrainzRecordingId: values.musicBrainzRecordingId,
          title: values.title,
          artist: values.artist,
          album: optionalText(values.album),
          releaseYear: parseOptionalInt(values.releaseYear),
          spotifyUrl: optionalText(values.spotifyUrl),
          soundcloudUrl: optionalText(values.soundcloudUrl),
        });
        setOpen(false);
        reset();
        onSaved?.();
      } finally {
        setSaving(false);
      }
    },
    [onSaved, reset],
  );

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {t("music.catalog.search")}
      </Button>
      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={t("music.catalog.search")}
      >
        {!online ? <p>{t("music.catalog.offline")}</p> : null}
        <form
          className="mb-4 flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch();
          }}
        >
          <TextField
            label={t("music.catalog.searchTracks.placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" disabled={loading || query.trim() === ""}>
            {loading ? t("music.catalog.loading") : t("music.catalog.search")}
          </Button>
        </form>
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        <ul className="flex flex-col gap-2">
          {results.map((hit) => (
            <li key={hit.musicBrainzRecordingId}>
              <button
                type="button"
                className="w-full rounded-lg border border-border px-3 py-2 text-left"
                onClick={() => setPreviewHit(hit)}
              >
                <span className="font-medium">{hit.title}</span>
                <span className="block text-sm text-muted">{hit.artist}</span>
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
      {previewHit !== null ? (
        <MusicTrackCatalogPreview
          open
          hit={previewHit}
          onClose={() => setPreviewHit(null)}
          onConfirm={confirmSave}
          saving={saving}
        />
      ) : null}
    </>
  );
}
