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

import { CatalogPreview, type CatalogPreviewValues } from "./catalog-preview";

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

  const reset = useCallback(() => {
    setQuery("");
    setLoading(false);
    setError(null);
    setResults([]);
    setDetailLoading(false);
    setPreviewOpen(false);
    setHit(null);
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
      const hits = await fetchBookCatalogSearch(trimmed);
      setResults(hits);
      if (hits.length === 0) setError(t("books.catalog.empty"));
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
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <TextField
              label={t("books.catalog.search.placeholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={loading || query.trim() === ""}>
              {loading ? t("books.catalog.loading") : t("books.lookup.search")}
            </Button>
            {detailLoading ? (
              <p className="text-sm text-muted" aria-live="polite">
                {t("books.catalog.loading")}
              </p>
            ) : null}
            {error !== null ? (
              <p className="text-sm text-muted" role="status">
                {error}
              </p>
            ) : null}
            {results.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {results.map((result) => (
                  <li key={result.isbn}>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/40"
                      onClick={() => void pickHit(result)}
                    >
                      <span className="font-medium">{result.title}</span>
                      <span className="mt-1 block text-sm text-muted">{formatHitSubtitle(result)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
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
    </>
  );
}
