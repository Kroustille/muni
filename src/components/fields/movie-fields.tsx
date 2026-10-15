"use client";

import type { CreateItemExtra } from "@/application/items";
import { defaultStatus, statusesFor, type MovieStatus } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { t, type MessageKey } from "@/i18n";

import { StarRating } from "@/components/StarRating";
import { RecommendedByInput } from "@/components/RecommendedByInput";
import { MultilineField } from "./multiline-field";

function ratingVisible(status: MovieStatus): boolean {
  return status === "watched";
}

export type MovieFieldValues = {
  title: string;
  status: MovieStatus;
  rating: number | null;
  recommendedBy: string;
  notes: string;
};

export const emptyMovieFieldValues = (): MovieFieldValues => ({
  title: "",
  status: defaultStatus("movie") as MovieStatus,
  rating: null,
  recommendedBy: "",
  notes: "",
});

export type MovieFieldsProps = {
  values: MovieFieldValues;
  onChange: (values: MovieFieldValues) => void;
  titleError?: string;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const statusOptions = statusesFor("movie").map((value) => ({
  value,
  label: t(`status.${value}` as MessageKey),
}));

export function movieFieldValuesToExtra(values: MovieFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = { status: values.status };
  const recommendedBy = optionalText(values.recommendedBy);
  if (recommendedBy) extra.recommendedBy = recommendedBy;
  const notes = optionalText(values.notes);
  if (notes) extra.notes = notes;
  if (ratingVisible(values.status) && values.rating !== null) {
    extra.rating = values.rating;
  }
  return extra;
}

export function MovieFields({ values, onChange, titleError }: MovieFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t("field.title")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
        autoComplete="off"
      />
      <Select
        label={t("field.status")}
        options={statusOptions}
        value={values.status}
        onChange={(event) =>
          onChange({ ...values, status: event.target.value as MovieStatus })
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
      <MultilineField
        label={t("field.notes")}
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
    </div>
  );
}
