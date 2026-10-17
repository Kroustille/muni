"use client";

import { useCallback, useState } from "react";

import { GroupCombobox } from "@/components/fields/GroupCombobox";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type BulkSagaSheetProps = {
  open: boolean;
  onClose: () => void;
  franchiseSuggestions: readonly string[];
  onConfirm: (franchiseName: string, franchiseOrder: number) => Promise<void>;
};

export function BulkSagaSheet({
  open,
  onClose,
  franchiseSuggestions,
  onConfirm,
}: BulkSagaSheetProps) {
  const [franchiseName, setFranchiseName] = useState("");
  const [orderText, setOrderText] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setFranchiseName("");
    setOrderText("");
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const order = Number.parseInt(orderText.trim(), 10);
  const canConfirm = franchiseName.trim() !== "" && Number.isFinite(order) && order > 0;

  const submit = useCallback(async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      await onConfirm(franchiseName.trim(), order);
      handleClose();
    } finally {
      setSaving(false);
    }
  }, [canConfirm, franchiseName, handleClose, onConfirm, order]);

  return (
    <BottomSheet open={open} onClose={handleClose} title={t("list.bulk.saga.title")}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <GroupCombobox
          label={t("list.bulk.saga.name")}
          value={franchiseName}
          onChange={setFranchiseName}
          suggestions={franchiseSuggestions}
        />
        <TextField
          label={t("list.bulk.saga.order")}
          value={orderText}
          onChange={(event) => setOrderText(event.target.value)}
          inputMode="numeric"
        />
        <Button type="submit" disabled={!canConfirm || saving}>
          {t("list.bulk.confirm")}
        </Button>
      </form>
    </BottomSheet>
  );
}
