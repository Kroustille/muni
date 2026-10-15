"use client";

import {
  LIST_SORT_FIELDS,
  LIST_SORT_ORDERS,
  type ListSort,
  type ListSortField,
  type ListSortOrder,
} from "@/domain/list-sort";
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

const ORDER_LABEL: Record<ListSortOrder, Parameters<typeof t>[0]> = {
  asc: "list.sort.order.asc",
  desc: "list.sort.order.desc",
};

function chipClass(active: boolean): string {
  return `cursor-pointer min-h-11 rounded-lg border px-3 text-sm ${
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-surface text-foreground"
  }`;
}

export function ListSortFilter({ value, onChange, allowRatingField }: ListSortFilterProps) {
  const fields = allowRatingField
    ? LIST_SORT_FIELDS
    : LIST_SORT_FIELDS.filter((field) => field === "date");

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{t("list.sort.by")}</span>
        {fields.map((field) => (
          <button
            key={field}
            type="button"
            className={chipClass(value.field === field)}
            aria-pressed={value.field === field}
            onClick={() => onChange({ ...value, field })}
          >
            {t(FIELD_LABEL[field])}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{t("list.sort.direction")}</span>
        {LIST_SORT_ORDERS.map((order) => (
          <button
            key={order}
            type="button"
            className={chipClass(value.order === order)}
            aria-pressed={value.order === order}
            onClick={() => onChange({ ...value, order })}
          >
            {t(ORDER_LABEL[order])}
          </button>
        ))}
      </div>
    </div>
  );
}
