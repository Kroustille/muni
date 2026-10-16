"use client";

import type { CreateItemExtra } from "@/application/items";
import { defaultStatus, statusesFor, type BookStatus } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { t, type MessageKey } from "@/i18n";

import { StarRating } from "@/components/StarRating";
import { RecommendedByInput } from "@/components/RecommendedByInput";
import { TagChipEditor } from "@/components/books/tag-chip-editor";
import { MultilineField } from "./multiline-field";

function ratingVisible(status: BookStatus): boolean {
  return status === "read";
}

export type BookFieldValues = {
  title: string;
  author: string;
  status: BookStatus;
  rating: number | null;
  recommendedBy: string;
  notes: string;
  tags: string[];
  seriesName: string;
  seriesPosition: string;
};

export const emptyBookFieldValues = (): BookFieldValues => ({
  title: "",
  author: "",
  status: defaultStatus("book") as BookStatus,
  rating: null,
  recommendedBy: "",
  notes: "",
  tags: [],
  seriesName: "",
  seriesPosition: "",
});

export type BookFieldsProps = {
  values: BookFieldValues;
  onChange: (values: BookFieldValues) => void;
  titleError?: string;
  /** Read-only catalog metadata (N1). */
  pageCount?: number | null;
  tagSuggestions?: readonly string[];
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const statusOptions = statusesFor("book").map((value) => ({
  value,
  label: t(`status.${value}` as MessageKey),
}));

export function bookFieldValuesToExtra(values: BookFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = { status: values.status };
  const author = optionalText(values.author);
  if (author) extra.author = author;
  const recommendedBy = optionalText(values.recommendedBy);
  if (recommendedBy) extra.recommendedBy = recommendedBy;
  const notes = optionalText(values.notes);
  if (notes) extra.notes = notes;
  if (ratingVisible(values.status) && values.rating !== null) {
    extra.rating = values.rating;
  }
  const tags = values.tags.map((tag) => tag.trim()).filter((tag) => tag !== "");
  extra.tags = tags.length === 0 ? null : tags;
  const seriesName = optionalText(values.seriesName);
  if (seriesName) extra.seriesName = seriesName;
  const positionRaw = values.seriesPosition.trim();
  if (positionRaw !== "") {
    const position = Number(positionRaw);
    if (!Number.isNaN(position)) extra.seriesPosition = position;
  }
  return extra;
}

export function BookFields({
  values,
  onChange,
  titleError,
  pageCount,
  tagSuggestions = [],
}: BookFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      {pageCount != null ? (
        <p className="text-sm text-muted">
          {t("field.pageCount")}: {pageCount}
        </p>
      ) : null}
      <TextField
        label={t("field.title")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
        autoComplete="off"
      />
      <TextField
        label={t("field.author")}
        value={values.author}
        onChange={(event) => onChange({ ...values, author: event.target.value })}
        autoComplete="off"
      />
      <Select
        label={t("field.status")}
        options={statusOptions}
        value={values.status}
        onChange={(event) =>
          onChange({ ...values, status: event.target.value as BookStatus })
        }
      />
      {ratingVisible(values.status) ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">{t("field.rating")}</span>
          <StarRating
            value={values.rating}
            onChange={(rating) => onChange({ ...values, rating })}
          />
        </div>
      ) : null}
      <RecommendedByInput
        value={values.recommendedBy}
        onChange={(recommendedBy) => onChange({ ...values, recommendedBy })}
      />
      <TagChipEditor
        tags={values.tags}
        suggestions={tagSuggestions}
        onChange={(tags) => onChange({ ...values, tags })}
      />
      <TextField
        label={t("books.series.name")}
        value={values.seriesName}
        onChange={(event) => onChange({ ...values, seriesName: event.target.value })}
        autoComplete="off"
      />
      <TextField
        label={t("books.series.position")}
        value={values.seriesPosition}
        onChange={(event) => onChange({ ...values, seriesPosition: event.target.value })}
        inputMode="numeric"
        autoComplete="off"
      />
      <MultilineField
        label={t("field.notes")}
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
    </div>
  );
}
