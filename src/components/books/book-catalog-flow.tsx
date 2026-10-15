"use client";

import { useCallback, useState, type ReactNode } from "react";

import type { BookCatalogHit } from "@/application/ports/book-catalog-lookup";
import { defaultStatus } from "@/domain/item";
import { getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import {
  BookCatalogLookupClientError,
  fetchBookCatalogHit,
} from "@/application/books/fetch-catalog-hit";
import { t } from "@/i18n";

import { CatalogPreview, type CatalogPreviewValues } from "./catalog-preview";
import { ScanModal } from "./scan-modal";

type FlowPhase = "idle" | "scanning" | "loading" | "preview" | "lookupError";

export type BookCatalogFlowProps = {
  onSaved?: () => void;
  /** Render prop for the scan trigger (mobile only). */
  children?: (startScan: () => void) => ReactNode;
  /** When true, always render the default scan button if no children. */
  showDefaultTrigger?: boolean;
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

async function saveCatalogPreview(values: CatalogPreviewValues): Promise<void> {
  const useCases = await getItemUseCases();
  const extra: Parameters<typeof useCases.createItem>[2] = {
    status: defaultStatus("book") ?? undefined,
    isbn: values.isbn,
  };
  const author = optionalText(values.author);
  if (author) extra.author = author;
  const synopsis = optionalText(values.synopsis);
  if (synopsis) extra.synopsis = synopsis;
  if (values.genres.length > 0) extra.genres = values.genres;
  const publicationYear = parseOptionalInt(values.publicationYear);
  if (publicationYear !== null) extra.publicationYear = publicationYear;
  const publisher = optionalText(values.publisher);
  if (publisher) extra.publisher = publisher;
  const pageCount = parseOptionalInt(values.pageCount);
  if (pageCount !== null) extra.pageCount = pageCount;
  await useCases.createItem("book", values.title.trim(), extra);
}

export function BookCatalogFlow({
  onSaved,
  children,
  showDefaultTrigger = true,
}: BookCatalogFlowProps) {
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [hit, setHit] = useState<BookCatalogHit | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startScan = useCallback(() => {
    setLookupError(null);
    setPhase("scanning");
  }, []);

  const closeAll = useCallback(() => {
    setPhase("idle");
    setHit(null);
    setLookupError(null);
  }, []);

  const runLookup = useCallback(async (rawIsbn: string) => {
    setPhase("loading");
    try {
      const nextHit = await fetchBookCatalogHit(rawIsbn);
      setHit(nextHit);
      setPhase("preview");
    } catch (error) {
      if (error instanceof BookCatalogLookupClientError) {
        if (error.code === "not_found") {
          setLookupError(t("books.lookup.notFound"));
        } else if (error.code === "invalid_isbn") {
          setLookupError(t("books.lookup.invalidIsbn"));
        } else {
          setLookupError(t("books.lookup.error"));
        }
      } else {
        setLookupError(t("books.lookup.error"));
      }
      setPhase("lookupError");
    }
  }, []);

  const onIsbnScanned = useCallback(
    (isbn: string) => {
      setPhase("idle");
      void runLookup(isbn);
    },
    [runLookup],
  );

  const onConfirm = useCallback(
    async (values: CatalogPreviewValues) => {
      setSaving(true);
      try {
        await saveCatalogPreview(values);
        closeAll();
        onSaved?.();
      } finally {
        setSaving(false);
      }
    },
    [closeAll, onSaved],
  );

  const trigger =
    children?.(startScan) ??
    (showDefaultTrigger ? (
      <Button type="button" onClick={startScan}>
        {t("books.scan")}
      </Button>
    ) : null);

  return (
    <>
      {trigger}
      <ScanModal open={phase === "scanning"} onClose={closeAll} onIsbn={onIsbnScanned} />
      {phase === "loading" ? (
        <p className="text-sm text-muted" aria-live="polite">
          {t("books.lookup.loading")}
        </p>
      ) : null}
      {hit !== null ? (
        <CatalogPreview
          open={phase === "preview"}
          hit={hit}
          onClose={closeAll}
          onConfirm={onConfirm}
          saving={saving}
        />
      ) : null}
      {phase === "lookupError" && lookupError !== null ? (
        <Toast
          message={lookupError}
          action={
            <Button type="button" variant="secondary" onClick={closeAll}>
              {t("action.close")}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
