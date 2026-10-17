"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

export type ListSelectionBarProps = {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  extraActions?: ReactNode;
};

export function ListSelectionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  extraActions,
}: ListSelectionBarProps) {
  if (selectedCount === 0) return null;

  const countLabel =
    selectedCount === 1
      ? t("list.selection.countOne")
      : t("list.selection.countMany").replace("{count}", String(selectedCount));

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 py-3 shadow-lg md:bottom-4 md:mx-auto md:max-w-3xl md:rounded-xl md:border"
      role="toolbar"
      aria-label={t("list.selection.toolbar")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{countLabel}</p>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <Button type="button" variant="danger" onClick={onBulkDelete}>
            {t("list.selection.delete")}
          </Button>
          <Button type="button" variant="secondary" onClick={onClearSelection}>
            {t("list.selection.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
