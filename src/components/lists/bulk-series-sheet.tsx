"use client";

import { useCallback, useState } from "react";

import { GroupCombobox } from "@/components/fields/GroupCombobox";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type BulkSeriesSheetProps = {
  open: boolean;
  onClose: () => void;
  seriesSuggestions: readonly string[];
  onConfirm: (seriesName: string, seriesPosition: number) => Promise<void>;
};

export function BulkSeriesSheet({
  open,
  onClose,
  seriesSuggestions,
  onConfirm,
}: BulkSeriesSheetProps) {
  const [seriesName, setSeriesName] = useState("");
  const [orderText, setOrderText] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setSeriesName("");
    setOrderText("");
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const order = Number.parseInt(orderText.trim(), 10);
  const canConfirm = seriesName.trim() !== "" && Number.isFinite(order) && order > 0;

  const submit = useCallback(async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      await onConfirm(seriesName.trim(), order);
      handleClose();
    } finally {
      setSaving(false);
    }
  }, [canConfirm, handleClose, onConfirm, order, seriesName]);

  return (
    <BottomSheet open={open} onClose={handleClose} title={t("list.bulk.series.title")}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <GroupCombobox
          label={t("list.bulk.series.name")}
          value={seriesName}
          onChange={setSeriesName}
          suggestions={seriesSuggestions}
        />
        <TextField
          label={t("list.bulk.series.order")}
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
