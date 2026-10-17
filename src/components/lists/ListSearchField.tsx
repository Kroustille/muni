"use client";

import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type ListSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ListSearchField({ value, onChange }: ListSearchFieldProps) {
  return (
    <TextField
      label={t("list.search.label")}
      placeholder={t("list.search.placeholder")}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="off"
    />
  );
}
