"use client";

import { useCallback, useEffect, useState } from "react";

import type { MovieCatalogDetail, MovieSearchHit } from "@/application/ports/movie-catalog-search";
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

import { runCatalogMultiAdd } from "@/application/catalog/catalog-multi-add";

import {
  MovieCatalogPreview,
  movieDetailToPreviewValues,
  type MovieCatalogPreviewValues,
} from "./catalog-preview";

export type MovieCatalogSearchProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onConfirmSave: (values: MovieCatalogPreviewValues) => Promise<void>;
  /** When set (quick-add), empty search offers manual add by prefilling the outer title field. */
  onManualAdd?: (title: string) => void;
};

function manualMovieDetail(title: string): MovieCatalogDetail {
  return {
    wikidataId: "manual",
    title: title.trim(),
    mediaKind: "film",
  };
}

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
  onManualAdd,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [batchError, setBatchError] = useState<string | null>(null);
  const [manualPreviewOpen, setManualPreviewOpen] = useState(false);
  const [manualDetail, setManualDetail] = useState<MovieCatalogDetail | null>(null);

  const reset = useCallback(() => {
    setQuery("");
    setLoading(false);
    setError(null);
    setResults([]);
    setDetailLoading(false);
    setPreviewOpen(false);
    setDetail(null);
    setSaving(false);
    setSelectedIds(new Set());
    setBatchError(null);
    setManualPreviewOpen(false);
    setManualDetail(null);
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

  const toggleSelected = useCallback((wikidataId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(wikidataId)) next.delete(wikidataId);
      else next.add(wikidataId);
      return next;
    });
  }, []);

  const runBatchAdd = useCallback(async () => {
    const selected = results.filter((hit) => selectedIds.has(hit.wikidataId));
    if (selected.length === 0) return;
    setSaving(true);
    setBatchError(null);
    try {
      const { failures } = await runCatalogMultiAdd(
        selected.map((hit) => ({ key: hit.wikidataId, title: hit.title, hit })),
        async ({ hit }) => {
          const loaded = await fetchMovieCatalogDetail(hit.wikidataId);
          await onConfirmSave(movieDetailToPreviewValues(loaded));
        },
      );
      if (failures.length > 0) {
        setBatchError(t("movies.catalog.addManyPartial"));
      } else {
        handleClose();
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }, [handleClose, onConfirmSave, onSaved, results, selectedIds]);

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

  const emptyAfterSearch =
    !loading &&
    query.trim() !== "" &&
    results.length === 0 &&
    error === t("movies.catalog.empty");

  const startManualAdd = useCallback(() => {
    const title = query.trim();
    if (title === "") return;
    if (onManualAdd) {
      onManualAdd(title);
      handleClose();
      return;
    }
    setManualDetail(manualMovieDetail(title));
    setManualPreviewOpen(true);
  }, [handleClose, onManualAdd, query]);

  return (
    <>
      <BottomSheet
        open={open && !previewOpen && !manualPreviewOpen}
        onClose={handleClose}
        title={t("movies.catalog.search")}
      >
        {!online ? (
          <p className="text-sm text-muted" role="status">
            {t("movies.catalog.offline")}
          </p>
        ) : (
          <div className="flex flex-col gap-3" role="search">
            <TextField
              label={t("movies.catalog.search.placeholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch();
                }
              }}
            />
            <Button
              type="button"
              disabled={loading || query.trim() === ""}
              onClick={() => void runSearch()}
            >
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
            {emptyAfterSearch ? (
              <Button type="button" variant="secondary" onClick={startManualAdd}>
                {t("books.addManually")}
              </Button>
            ) : null}
            {batchError !== null ? (
              <p className="text-sm text-danger" role="alert">{batchError}</p>
            ) : null}
            {results.length > 0 ? (
              <>
                <Button
                  type="button"
                  disabled={selectedIds.size === 0 || saving}
                  onClick={() => void runBatchAdd()}
                >
                  {t("movies.catalog.addMany").replace("{count}", String(selectedIds.size))}
                </Button>
                <ul className="flex flex-col gap-2">
                  {results.map((hit) => (
                    <li key={hit.wikidataId} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
                      <input
                        type="checkbox"
                        className="mt-1 size-5 shrink-0 accent-primary"
                        checked={selectedIds.has(hit.wikidataId)}
                        onChange={() => toggleSelected(hit.wikidataId)}
                        aria-label={hit.title}
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left hover:opacity-90"
                        onClick={() => void pickHit(hit)}
                      >
                        <span className="font-medium">{hit.title}</span>
                        <span className="mt-1 block text-sm text-muted">{formatHitSubtitle(hit)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
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
      {manualDetail !== null ? (
        <MovieCatalogPreview
          open={manualPreviewOpen}
          detail={manualDetail}
          onClose={() => {
            setManualPreviewOpen(false);
            setManualDetail(null);
          }}
          onConfirm={confirmSave}
          saving={saving}
        />
      ) : null}
    </>
  );
}
