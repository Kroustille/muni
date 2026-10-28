"use client";

import { useState } from "react";
import { recordRecipeCookedOnClient } from "@/composition/client-recap";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

type RecipeCookedActionsProps = {
  itemId: string;
  onRecorded?: () => void;
};

export function RecipeCookedActions({ itemId, onRecorded }: RecipeCookedActionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markCooked(cookedOn?: string) {
    setBusy(true);
    setError(null);
    const result = await recordRecipeCookedOnClient({ itemId, cookedOn });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setShowPicker(false);
    onRecorded?.();
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void markCooked()}>
          {t("recipe.cooked.action")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => setShowPicker((value) => !value)}
        >
          {t("recipe.cooked.pickDate")}
        </Button>
      </div>
      {showPicker ? (
        <div className="flex flex-wrap items-end gap-2">
          <TextField
            label={t("recipe.cooked.date")}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Button
            type="button"
            disabled={busy || date === ""}
            onClick={() => void markCooked(date)}
          >
            {t("recipe.cooked.action")}
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
