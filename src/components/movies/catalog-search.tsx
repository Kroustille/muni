"use client";

import { useCallback, useEffect, useState } from "react";

import type { MovieSearchHit } from "@/application/ports/movie-catalog-search";
import {
  MovieCatalogClientError,
  fetchMovieCatalogDetail,
  searchMoviesCatalog,
} from "@/application/movies/fetch-movie-catalog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useDebouncedSearch } from "@/components/use-debounced-search";
import { useOnline } from "@/components/use-online";
import { t, type MessageKey } from "@/i18n";

import { MovieCatalogPreview, type MovieCatalogPreviewValues } from "./catalog-preview";

export type MovieCatalogSearchProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onConfirmSave: (values: MovieCatalogPreviewValues) => Promise<void>;
};

function formatHitSubtitle(hit: MovieSearchHit): string {
  const parts: string[] = [];
  if (hit.releaseYear !== undefined) parts.push(String(hit.releaseYear));
  parts.push(t(`movies.mediaKind.${hit.mediaKind}` as MessageKey));
  if (hit.catalogRating !== undefined) {
    parts.push(`${t("field.catalogRating")} ${hit.catalogRating}`);
  }
  return parts.join(" · ");
}

export function MovieCatalogSearchSheet({
  open,
  onClose,
  onSaved,
  onConfirmSave,
}: MovieCatalogSearchProps) {
  const online = useOnline();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MovieSearchHit[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchMovieCatalogDetail>> | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setQuery("");
    setLoading(false);
    setError(null);
    setResults([]);
    setDetailLoading(false);
    setPreviewOpen(false);
    setDetail(null);
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const runSearch = useCallback(async () => {
    if (!online) return;
    const trimmed = query.trim();
    if (trimmed === "") return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const hits = await searchMoviesCatalog(trimmed);
      setResults(hits);
      if (hits.length === 0) setError(t("movies.catalog.empty"));
    } catch (err) {
      setError(
        err instanceof MovieCatalogClientError && err.code === "provider_error"
          ? t("movies.catalog.error")
          : t("movies.catalog.error"),
      );
    } finally {
      setLoading(false);
    }
  }, [online, query]);

  useDebouncedSearch(query, open && !previewOpen && online, runSearch);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setError(null);
    }
  }, [query]);

  const pickHit = useCallback(async (hit: MovieSearchHit) => {
    setDetailLoading(true);
    setError(null);
    try {
      const loaded = await fetchMovieCatalogDetail(hit.wikidataId);
      setDetail(loaded);
      setPreviewOpen(true);
    } catch {
      setError(t("movies.catalog.error"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const confirmSave = useCallback(
    async (values: MovieCatalogPreviewValues) => {
      setSaving(true);
      try {
        await onConfirmSave(values);
        handleClose();
        onSaved?.();
      } finally {
        setSaving(false);
      }
    },
    [handleClose, onConfirmSave, onSaved],
  );

  return (
    <>
      <BottomSheet open={open && !previewOpen} onClose={handleClose} title={t("movies.catalog.search")}>
        {!online ? (
          <p className="text-sm text-muted" role="status">
            {t("movies.catalog.offline")}
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <TextField
              label={t("movies.catalog.search.placeholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={loading || query.trim() === ""}>
              {loading ? t("movies.catalog.loading") : t("books.lookup.search")}
            </Button>
            {detailLoading ? (
              <p className="text-sm text-muted" aria-live="polite">
                {t("movies.catalog.loading")}
              </p>
            ) : null}
            {error !== null ? (
              <p className="text-sm text-muted" role="status">
                {error}
              </p>
            ) : null}
            {results.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {results.map((hit) => (
                  <li key={hit.wikidataId}>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/40"
                      onClick={() => void pickHit(hit)}
                    >
                      <span className="font-medium">{hit.title}</span>
                      <span className="mt-1 block text-sm text-muted">{formatHitSubtitle(hit)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
        )}
      </BottomSheet>
      {detail !== null ? (
        <MovieCatalogPreview
          open={previewOpen}
          detail={detail}
          onClose={() => {
            setPreviewOpen(false);
            setDetail(null);
          }}
          onConfirm={confirmSave}
          saving={saving}
        />
      ) : null}
    </>
  );
}
