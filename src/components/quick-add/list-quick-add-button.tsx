"use client";

import type { ItemType } from "@/domain/item";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

import { useQuickAdd } from "./quick-add-context";

export type ListQuickAddButtonProps = {
  itemType: ItemType;
};

export function ListQuickAddButton({ itemType }: ListQuickAddButtonProps) {
  const { openQuickAdd } = useQuickAdd();
  return (
    <Button type="button" variant="secondary" onClick={() => openQuickAdd(itemType)}>
      {t("action.add")}
    </Button>
  );
}
