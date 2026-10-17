"use client";

import type { Item } from "@/domain/item";
import { DeleteWithUndoButton } from "@/components/UndoToast";
import { t } from "@/i18n";
import { ListRowShell } from "./ListRowShell";
import { ListRowTitle } from "./ListRowTitle";

export type ShoppingRowProps = {
  item: Item & { type: "shopping" };
  onCheckedChange: (checked: boolean) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  selectionMode?: boolean;
  bulkSelected?: boolean;
  onBulkToggle?: () => void;
  showDelete?: boolean;
};

export function ShoppingRow({
  item,
  onCheckedChange,
  onSelect,
  selected,
  selectionMode = false,
  bulkSelected = false,
  onBulkToggle,
  showDelete = false,
}: ShoppingRowProps) {
  return (
    <ListRowShell itemType="shopping" selected={selected || bulkSelected}>
      <div className="flex items-start gap-3">
        {selectionMode ? (
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 cursor-pointer accent-primary"
            checked={bulkSelected}
            onChange={() => onBulkToggle?.()}
            aria-label={item.title}
          />
        ) : (
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 cursor-pointer accent-primary"
            aria-label={item.title}
            checked={item.checked}
            onChange={(event) => onCheckedChange(event.target.checked)}
          />
        )}
        <div className="min-w-0 flex-1">
          <ListRowTitle
            itemId={item.id}
            onSelect={onSelect}
            className={item.checked ? "text-muted line-through" : ""}
          >
            {item.title}
          </ListRowTitle>
          {item.quantity ? (
            <p className="text-sm text-muted">
              <span className="sr-only">{t("field.quantity")}: </span>
              {item.quantity}
            </p>
          ) : null}
        </div>
        {showDelete && !selectionMode ? (
          <DeleteWithUndoButton itemId={item.id} className="shrink-0" />
        ) : null}
      </div>
    </ListRowShell>
  );
}
