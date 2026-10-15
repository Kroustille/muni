"use client";

import type { CreateItemExtra } from "@/application/items";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type ShoppingFieldValues = {
  title: string;
  quantity: string;
};

export const emptyShoppingFieldValues = (): ShoppingFieldValues => ({
  title: "",
  quantity: "",
});

export type ShoppingFieldsProps = {
  values: ShoppingFieldValues;
  onChange: (values: ShoppingFieldValues) => void;
  titleError?: string;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function shoppingFieldValuesToExtra(values: ShoppingFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = {};
  const quantity = optionalText(values.quantity);
  if (quantity) extra.quantity = quantity;
  return extra;
}

export function ShoppingFields({ values, onChange, titleError }: ShoppingFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t("field.name")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
        autoComplete="off"
      />
      <TextField
        label={t("field.quantity")}
        value={values.quantity}
        onChange={(event) => onChange({ ...values, quantity: event.target.value })}
        autoComplete="off"
      />
    </div>
  );
}
