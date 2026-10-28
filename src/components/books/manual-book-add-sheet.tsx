"use client";

import { useEffect, useState } from "react";

import { getItemUseCases } from "@/composition/client";
import { defaultStatus } from "@/domain/item";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type ManualBookAddSheetProps = {
  open: boolean;
  isbn?: string;
  initialTitle?: string;
  onClose: () => void;
  onSaved?: () => void;
};

export function ManualBookAddSheet({
  open,
  isbn = "",
  initialTitle = "",
  onClose,
  onSaved,
}: ManualBookAddSheetProps) {
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setAuthor("");
      setTitleError(undefined);
    }
  }, [initialTitle, open]);

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(t("validation.titleRequired"));
      return;
    }
    setSaving(true);
    try {
      const useCases = await getItemUseCases();
      const extra: Parameters<typeof useCases.createItem>[2] = {
        status: defaultStatus("book") ?? undefined,
      };
      const isbnTrimmed = isbn.trim();
      if (isbnTrimmed) extra.isbn = isbnTrimmed;
      const authorTrimmed = author.trim();
      if (authorTrimmed) extra.author = authorTrimmed;
      await useCases.createItem("book", trimmed, extra);
      onSaved?.();
      onClose();
      setTitle("");
      setAuthor("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} title={t("type.book")} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        {isbn.trim() !== "" ? (
          <TextField label={t("field.isbn")} value={isbn} disabled />
        ) : null}
        <TextField
          label={t("field.title")}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleError(undefined);
          }}
          error={titleError}
        />
        <TextField
          label={t("field.author")}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
        />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {t("action.save")}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
