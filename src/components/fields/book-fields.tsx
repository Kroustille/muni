"use client";

import type { CreateItemExtra } from "@/application/items";
import { defaultStatus, statusesFor, type BookStatus } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { t, type MessageKey } from "@/i18n";

import { RecommendedByInput } from "@/components/RecommendedByInput";
import { MultilineField } from "./multiline-field";

export type BookFieldValues = {
  title: string;
  author: string;
  status: BookStatus;
  recommendedBy: string;
  notes: string;
};

export const emptyBookFieldValues = (): BookFieldValues => ({
  title: "",
  author: "",
  status: defaultStatus("book") as BookStatus,
  recommendedBy: "",
  notes: "",
});

export type BookFieldsProps = {
  values: BookFieldValues;
  onChange: (values: BookFieldValues) => void;
  titleError?: string;
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
  return extra;
}

export function BookFields({ values, onChange, titleError }: BookFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
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
