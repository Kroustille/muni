"use client";

import { useEffect, useState } from "react";

import type { BookCatalogHit } from "@/application/ports/book-catalog-lookup";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { MultilineField } from "@/components/fields/multiline-field";
import { t } from "@/i18n";

export type CatalogPreviewValues = {
  isbn: string;
  title: string;
  author: string;
  synopsis: string;
  genres: string[];
  publicationYear: string;
  publisher: string;
  pageCount: string;
  workId: string;
};

export type CatalogPreviewProps = {
  open: boolean;
  hit: BookCatalogHit;
  onClose: () => void;
  onConfirm: (values: CatalogPreviewValues) => void | Promise<void>;
  saving?: boolean;
};

export function catalogHitToPreviewValues(hit: BookCatalogHit): CatalogPreviewValues {
  return {
    isbn: hit.isbn,
    title: hit.title,
    author: hit.author ?? "",
    synopsis: hit.synopsis ?? "",
    genres: hit.genres ? [...hit.genres] : [],
    publicationYear: hit.publicationYear !== undefined ? String(hit.publicationYear) : "",
    publisher: hit.publisher ?? "",
    pageCount: hit.pageCount !== undefined ? String(hit.pageCount) : "",
    workId: hit.workId ?? "",
  };
}

function GenresEditor({
  genres,
  onChange,
}: {
  genres: string[];
  onChange: (genres: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addGenre = () => {
    const next = draft.trim();
    if (next === "" || genres.includes(next)) return;
    onChange([...genres, next]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted">{t("field.genres")}</span>
      <ul className="flex flex-col gap-1">
        {genres.map((genre) => (
          <li key={genre} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1">
            <span>{genre}</span>
            <button
              type="button"
              className="text-sm text-muted"
              aria-label={t("books.genres.remove")}
              onClick={() => onChange(genres.filter((value) => value !== genre))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <TextField
          label={t("books.genres.add")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addGenre();
            }
          }}
        />
        <Button type="button" variant="secondary" className="self-end" onClick={addGenre}>
          {t("books.genres.add")}
        </Button>
      </div>
    </div>
  );
}

export function CatalogPreview({ open, hit, onClose, onConfirm, saving = false }: CatalogPreviewProps) {
  const [values, setValues] = useState<CatalogPreviewValues>(() => catalogHitToPreviewValues(hit));

  useEffect(() => {
    if (open) setValues(catalogHitToPreviewValues(hit));
  }, [hit, open]);

  const submit = async () => {
    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) return;
    await onConfirm({ ...values, title: trimmedTitle });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("books.preview.title")}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField label={t("field.isbn")} value={values.isbn} readOnly />
        <TextField
          label={t("field.title")}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
        <TextField
          label={t("field.author")}
          value={values.author}
          onChange={(event) => setValues({ ...values, author: event.target.value })}
        />
        <MultilineField
          label={t("field.synopsis")}
          value={values.synopsis}
          onChange={(event) => setValues({ ...values, synopsis: event.target.value })}
        />
        <GenresEditor
          genres={values.genres}
          onChange={(genres) => setValues({ ...values, genres })}
        />
        <TextField
          label={t("field.publicationYear")}
          inputMode="numeric"
          value={values.publicationYear}
          onChange={(event) => setValues({ ...values, publicationYear: event.target.value })}
        />
        <TextField
          label={t("field.publisher")}
          value={values.publisher}
          onChange={(event) => setValues({ ...values, publisher: event.target.value })}
        />
        <TextField
          label={t("field.pageCount")}
          inputMode="numeric"
          value={values.pageCount}
          onChange={(event) => setValues({ ...values, pageCount: event.target.value })}
        />
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
