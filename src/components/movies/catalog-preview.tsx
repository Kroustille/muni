"use client";

import { useEffect, useState } from "react";

import type { MovieCatalogDetail } from "@/application/ports/movie-catalog-search";
import type { MediaKind } from "@/domain/item";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { MultilineField } from "@/components/fields/multiline-field";
import { t, type MessageKey } from "@/i18n";

export type MovieCatalogPreviewValues = {
  wikidataId: string;
  title: string;
  synopsis: string;
  releaseYear: string;
  imdbId: string;
  mediaKind: MediaKind;
  catalogRating: string;
  director: string;
  cast: string[];
};

export type MovieCatalogPreviewProps = {
  open: boolean;
  detail: MovieCatalogDetail;
  onClose: () => void;
  onConfirm: (values: MovieCatalogPreviewValues) => void | Promise<void>;
  saving?: boolean;
};

export function movieDetailToPreviewValues(detail: MovieCatalogDetail): MovieCatalogPreviewValues {
  return {
    wikidataId: detail.wikidataId,
    title: detail.title,
    synopsis: detail.synopsis ?? "",
    releaseYear: detail.releaseYear !== undefined ? String(detail.releaseYear) : "",
    imdbId: detail.imdbId ?? "",
    mediaKind: detail.mediaKind,
    catalogRating: detail.catalogRating !== undefined ? String(detail.catalogRating) : "",
    director: detail.director ?? "",
    cast: detail.cast ? [...detail.cast] : [],
  };
}

const mediaKindOptions = (["film", "series"] as const).map((value) => ({
  value,
  label: t(`movies.mediaKind.${value}` as MessageKey),
}));

export function MovieCatalogPreview({
  open,
  detail,
  onClose,
  onConfirm,
  saving = false,
}: MovieCatalogPreviewProps) {
  const [values, setValues] = useState<MovieCatalogPreviewValues>(() =>
    movieDetailToPreviewValues(detail),
  );

  useEffect(() => {
    if (open) setValues(movieDetailToPreviewValues(detail));
  }, [detail, open]);

  const submit = async () => {
    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) return;
    await onConfirm({ ...values, title: trimmedTitle });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("movies.preview.title")}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          label={t("field.title")}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
        <MultilineField
          label={t("field.synopsis")}
          value={values.synopsis}
          onChange={(event) => setValues({ ...values, synopsis: event.target.value })}
        />
        <TextField
          label={t("field.releaseYear")}
          inputMode="numeric"
          value={values.releaseYear}
          onChange={(event) => setValues({ ...values, releaseYear: event.target.value })}
        />
        <TextField
          label={t("field.imdbId")}
          value={values.imdbId}
          onChange={(event) => setValues({ ...values, imdbId: event.target.value })}
        />
        <Select
          label={t("field.mediaKind")}
          options={mediaKindOptions}
          value={values.mediaKind}
          onChange={(event) =>
            setValues({ ...values, mediaKind: event.target.value as MediaKind })
          }
        />
        {values.catalogRating.trim() !== "" ? (
          <p className="text-sm text-muted">
            {t("field.catalogRating")}: {values.catalogRating}
          </p>
        ) : null}
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
