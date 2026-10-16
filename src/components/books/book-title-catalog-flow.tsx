"use client";

import { useCallback, useState } from "react";

import { getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

import { BookCatalogSearchSheet } from "./book-catalog-search";
import type { CatalogPreviewValues } from "./catalog-preview";

export type BookTitleCatalogFlowProps = {
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

async function saveCatalogPreview(values: CatalogPreviewValues): Promise<void> {
  const useCases = await getItemUseCases();
  await useCases.upsertBookFromCatalog({
    isbn: values.isbn,
    title: values.title.trim(),
    author: optionalText(values.author),
    synopsis: optionalText(values.synopsis),
    genres: values.genres.length > 0 ? values.genres : null,
    publicationYear: parseOptionalInt(values.publicationYear),
    publisher: optionalText(values.publisher),
    pageCount: parseOptionalInt(values.pageCount),
    workId: optionalText(values.workId),
  });
}

export function BookTitleCatalogFlow({ onSaved }: BookTitleCatalogFlowProps) {
  const [open, setOpen] = useState(false);

  const onConfirmSave = useCallback(async (values: CatalogPreviewValues) => {
    await saveCatalogPreview(values);
  }, []);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {t("books.catalog.search")}
      </Button>
      <BookCatalogSearchSheet
        open={open}
        onClose={() => setOpen(false)}
        onSaved={onSaved}
        onConfirmSave={onConfirmSave}
      />
    </>
  );
}
