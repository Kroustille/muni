"use client";

import {
  LIST_SORT_FIELDS,
  LIST_SORT_ORDERS,
  type ListSort,
  type ListSortField,
  type ListSortOrder,
} from "@/domain/list-sort";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

export type ListSortFilterProps = {
  value: ListSort;
  onChange: (value: ListSort) => void;
  allowRatingField: boolean;
};

const FIELD_LABEL: Record<ListSortField, Parameters<typeof t>[0]> = {
  date: "list.sort.field.date",
  rating: "list.sort.field.rating",
};

function toggleOrder(order: ListSortOrder): ListSortOrder {
  return order === "asc" ? "desc" : "asc";
}

export function listSortDirectionAriaKey(order: ListSortOrder): "list.sort.toggleToDesc" | "list.sort.toggleToAsc" {
  return order === "asc" ? "list.sort.toggleToDesc" : "list.sort.toggleToAsc";
}

function directionAriaLabel(order: ListSortOrder): string {
  return t(listSortDirectionAriaKey(order));
}

export function ListSortFilter({ value, onChange, allowRatingField }: ListSortFilterProps) {
  const fields = allowRatingField
    ? LIST_SORT_FIELDS
    : LIST_SORT_FIELDS.filter((field) => field === "date");

  const fieldOptions = fields.map((field) => ({
    value: field,
    label: t(FIELD_LABEL[field]),
  }));

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <Select
        label={t("list.sort.by")}
        options={fieldOptions}
        value={value.field}
        onChange={(event) => onChange({ ...value, field: event.target.value as ListSortField })}
        className="min-w-[10rem]"
      />
      <Button
        type="button"
        variant="secondary"
        className="min-h-11"
        aria-label={directionAriaLabel(value.order)}
        onClick={() => onChange({ ...value, order: toggleOrder(value.order) })}
      >
        {value.order === "asc" ? t("list.sort.order.asc") : t("list.sort.order.desc")}
      </Button>
    </div>
  );
}
