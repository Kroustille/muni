"use client";

import { useCallback, useEffect, useState } from "react";

import type { BookCatalogHit } from "@/application/ports/book-catalog-lookup";
import {
  BookCatalogLookupClientError,
  fetchBookCatalogHit,
} from "@/application/books/fetch-catalog-hit";
import { fetchBookCatalogSearch } from "@/application/books/fetch-book-catalog-search";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useDebouncedSearch } from "@/components/use-debounced-search";
import { useOnline } from "@/components/use-online";
import { t } from "@/i18n";

import { runCatalogMultiAdd } from "@/application/catalog/catalog-multi-add";

import { CatalogPreview, catalogHitToPreviewValues, type CatalogPreviewValues } from "./catalog-preview";
import { ManualBookAddSheet } from "./manual-book-add-sheet";

export type BookCatalogSearchSheetProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onConfirmSave: (values: CatalogPreviewValues) => Promise<void>;
};

function formatHitSubtitle(hit: BookCatalogHit): string {
  const parts: string[] = [];
  if (hit.author) parts.push(hit.author);
  if (hit.publicationYear !== undefined) parts.push(String(hit.publicationYear));
  return parts.join(" · ");
}

export function BookCatalogSearchSheet({
  open,
  onClose,
  onSaved,
  onConfirmSave,
}: BookCatalogSearchSheetProps) {
  const online = useOnline();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BookCatalogHit[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hit, setHit] = useState<BookCatalogHit | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIsbns, setSelectedIsbns] = useState<Set<string>>(() => new Set());
  const [batchError, setBatchError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [emptyResults, setEmptyResults] = useState(false);

  const reset = useCallback(() => {
    setQuery("");
    setLoading(false);
    setError(null);
    setResults([]);
    setDetailLoading(false);
    setPreviewOpen(false);
    setHit(null);
    setSaving(false);
    setSelectedIsbns(new Set());
    setBatchError(null);
    setManualOpen(false);
    setEmptyResults(false);
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
    setEmptyResults(false);
    try {
      const hits = await fetchBookCatalogSearch(trimmed);
      setResults(hits);
      if (hits.length === 0) {
        setError(t("books.catalog.empty"));
        setEmptyResults(true);
      }
    } catch {
      setError(t("books.catalog.error"));
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

  const pickHit = useCallback(async (searchHit: BookCatalogHit) => {
    setDetailLoading(true);
    setError(null);
    try {
      try {
        const loaded = await fetchBookCatalogHit(searchHit.isbn);
        setHit(loaded);
      } catch (error) {
        if (
          error instanceof BookCatalogLookupClientError &&
          error.code === "not_found"
        ) {
          setHit(searchHit);
        } else {
          throw error;
        }
      }
      setPreviewOpen(true);
    } catch {
      setError(t("books.catalog.error"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const toggleSelected = useCallback((isbn: string) => {
    setSelectedIsbns((current) => {
      const next = new Set(current);
      if (next.has(isbn)) next.delete(isbn);
      else next.add(isbn);
      return next;
    });
  }, []);

  const runBatchAdd = useCallback(async () => {
    const selected = results.filter((hit) => selectedIsbns.has(hit.isbn));
    if (selected.length === 0) return;
    setSaving(true);
    setBatchError(null);
    try {
      const { failures } = await runCatalogMultiAdd(
        selected.map((hit) => ({ key: hit.isbn, title: hit.title, hit })),
        async ({ hit: searchHit }) => {
          let loaded = searchHit;
          try {
            loaded = await fetchBookCatalogHit(searchHit.isbn);
          } catch (error) {
            if (
              !(error instanceof BookCatalogLookupClientError && error.code === "not_found")
            ) {
              throw error;
            }
          }
          await onConfirmSave(catalogHitToPreviewValues(loaded));
        },
      );
      if (failures.length > 0) {
        setBatchError(t("books.catalog.addManyPartial"));
      } else {
        handleClose();
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }, [handleClose, onConfirmSave, onSaved, results, selectedIsbns]);

  const confirmSave = useCallback(
    async (values: CatalogPreviewValues) => {
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
      <BottomSheet open={open && !previewOpen} onClose={handleClose} title={t("books.catalog.search")}>
        {!online ? (
          <p className="text-sm text-muted" role="status">
            {t("books.catalog.offline")}
          </p>
        ) : (
          <div className="flex flex-col gap-3" role="search">
            <TextField
              label={t("books.catalog.search.placeholder")}
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
              {loading ? t("books.catalog.loading") : t("books.lookup.search")}
            </Button>
            {detailLoading ? (
              <p className="text-sm text-muted" aria-live="polite">
                {t("books.catalog.loading")}
              </p>
            ) : null}
            {error !== null ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted" role="status">
                  {error}
                </p>
                {emptyResults ? (
                  <Button type="button" variant="secondary" onClick={() => setManualOpen(true)}>
                    {t("books.addManually")}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {batchError !== null ? (
              <p className="text-sm text-danger" role="alert">{batchError}</p>
            ) : null}
            {results.length > 0 ? (
              <>
                <Button
                  type="button"
                  disabled={selectedIsbns.size === 0 || saving}
                  onClick={() => void runBatchAdd()}
                >
                  {t("books.catalog.addMany").replace("{count}", String(selectedIsbns.size))}
                </Button>
                <ul className="flex flex-col gap-2">
                  {results.map((result) => (
                    <li key={result.isbn} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
                      <input
                        type="checkbox"
                        className="mt-1 size-5 shrink-0 accent-primary"
                        checked={selectedIsbns.has(result.isbn)}
                        onChange={() => toggleSelected(result.isbn)}
                        aria-label={result.title}
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left hover:opacity-90"
                        onClick={() => void pickHit(result)}
                      >
                        <span className="font-medium">{result.title}</span>
                        <span className="mt-1 block text-sm text-muted">{formatHitSubtitle(result)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        )}
      </BottomSheet>
      {hit !== null ? (
        <CatalogPreview
          open={previewOpen}
          hit={hit}
          onClose={() => {
            setPreviewOpen(false);
            setHit(null);
          }}
          onConfirm={confirmSave}
          saving={saving}
        />
      ) : null}
      <ManualBookAddSheet
        open={manualOpen}
        initialTitle={query.trim()}
        onClose={() => setManualOpen(false)}
        onSaved={() => {
          setManualOpen(false);
          handleClose();
          onSaved?.();
        }}
      />
    </>
  );
}
