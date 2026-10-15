"use client";

import { useCallback, useState } from "react";

import { searchMusicArtistsCatalog } from "@/application/music/fetch-music-catalog";
import type { MusicArtistSearchHit } from "@/application/ports/music-catalog-search";
import { getItemUseCases } from "@/composition/client";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useOnline } from "@/components/use-online";
import { t } from "@/i18n";

import { MusicArtistCatalogPreview, type MusicArtistPreviewValues } from "./artist-catalog-preview";

export type MusicArtistCatalogFlowProps = {
  onSaved?: () => void;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function MusicArtistCatalogFlow({ onSaved }: MusicArtistCatalogFlowProps) {
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MusicArtistSearchHit[]>([]);
  const [previewHit, setPreviewHit] = useState<MusicArtistSearchHit | null>(null);
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
      const hits = await searchMusicArtistsCatalog(trimmed);
      setResults(hits);
      if (hits.length === 0) setError(t("music.catalog.empty"));
    } catch {
      setError(t("music.catalog.error"));
    } finally {
      setLoading(false);
    }
  }, [online, query]);

  const confirmSave = useCallback(
    async (values: MusicArtistPreviewValues) => {
      setSaving(true);
      try {
        const useCases = await getItemUseCases();
        await useCases.upsertMusicArtistFromCatalog({
          musicBrainzArtistId: values.musicBrainzArtistId,
          title: values.title,
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
            label={t("music.catalog.searchArtists.placeholder")}
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
            <li key={hit.musicBrainzArtistId}>
              <button
                type="button"
                className="w-full rounded-lg border border-border px-3 py-2 text-left"
                onClick={() => setPreviewHit(hit)}
              >
                <span className="font-medium">{hit.name}</span>
                {hit.disambiguation ? (
                  <span className="block text-sm text-muted">{hit.disambiguation}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
      {previewHit !== null ? (
        <MusicArtistCatalogPreview
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
