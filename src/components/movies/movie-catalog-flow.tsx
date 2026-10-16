"use client";

import { useCallback, useState } from "react";

import { getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

import { MovieCatalogSearchSheet } from "./catalog-search";
import type { MovieCatalogPreviewValues } from "./catalog-preview";

export type MovieCatalogFlowProps = {
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

function parseOptionalRating(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

async function saveMoviePreview(values: MovieCatalogPreviewValues): Promise<void> {
  const useCases = await getItemUseCases();
  await useCases.upsertMovieFromCatalog({
    imdbId: optionalText(values.imdbId),
    title: values.title.trim(),
    synopsis: optionalText(values.synopsis),
    releaseYear: parseOptionalInt(values.releaseYear),
    catalogRating: parseOptionalRating(values.catalogRating),
    mediaKind: values.mediaKind,
    director: optionalText(values.director),
    cast: values.cast.length > 0 ? values.cast : null,
  });
}

export function MovieCatalogFlow({ onSaved }: MovieCatalogFlowProps) {
  const [open, setOpen] = useState(false);

  const onConfirmSave = useCallback(async (values: MovieCatalogPreviewValues) => {
    await saveMoviePreview(values);
  }, []);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {t("movies.catalog.search")}
      </Button>
      <MovieCatalogSearchSheet
        open={open}
        onClose={() => setOpen(false)}
        onSaved={onSaved}
        onConfirmSave={onConfirmSave}
      />
    </>
  );
}
