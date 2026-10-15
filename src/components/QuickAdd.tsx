"use client";

import { useCallback, useState } from "react";
import type { CreateItemExtra } from "@/application/items";
import type { ItemType } from "@/domain/item";
import { getItemUseCases } from "@/composition/client";
import { t } from "@/i18n";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

type ItemKind = ItemType;

const TYPE_OPTIONS: ItemKind[] = ["shopping", "book", "movie", "recipe"];

const typeLabel = (kind: ItemKind): string => {
  const map: Record<ItemKind, Parameters<typeof t>[0]> = {
    shopping: "type.shopping",
    book: "type.book",
    movie: "type.movie",
    recipe: "type.recipe",
  };
  return t(map[kind]);
};

const titleLabel = (kind: ItemKind): string =>
  kind === "shopping" ? t("field.name") : t("field.title");

type FormState = {
  title: string;
  author: string;
  quantity: string;
  recommendedBy: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  title: "",
  author: "",
  quantity: "",
  recommendedBy: "",
  notes: "",
});

function buildExtra(kind: ItemKind, form: FormState): CreateItemExtra {
  const extra: CreateItemExtra = {};
  const set = (key: keyof CreateItemExtra, value: string) => {
    const trimmed = value.trim();
    if (trimmed) (extra as Record<string, string>)[key] = trimmed;
  };
  if (kind === "shopping") {
    set("quantity", form.quantity);
  }
  if (kind === "book") {
    set("author", form.author);
    set("recommendedBy", form.recommendedBy);
    set("notes", form.notes);
  }
  if (kind === "movie") {
    set("recommendedBy", form.recommendedBy);
    set("notes", form.notes);
  }
  if (kind === "recipe") {
    set("notes", form.notes);
  }
  return extra;
}

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick-type" | "form">("pick-type");
  const [kind, setKind] = useState<ItemKind | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setStep("pick-type");
    setKind(null);
    setForm(emptyForm());
    setTitleError(undefined);
    setSubmitting(false);
  }, []);

  const openFlow = useCallback(() => {
    setOpen(true);
    setStep("pick-type");
    setKind(null);
    setForm(emptyForm());
    setTitleError(undefined);
  }, []);

  const pickType = useCallback((next: ItemKind) => {
    setKind(next);
    setForm(emptyForm());
    setTitleError(undefined);
    setStep("form");
  }, []);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (patch.title !== undefined) setTitleError(undefined);
  }, []);

  const submit = useCallback(async () => {
    if (kind === null) return;
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setTitleError(t("validation.titleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const useCases = await getItemUseCases();
      await useCases.createItem(kind, trimmedTitle, buildExtra(kind, form));
      close();
    } catch {
      setTitleError(t("validation.titleRequired"));
      setSubmitting(false);
    }
  }, [close, form, kind]);

  const sheetTitle =
    step === "pick-type" || kind === null ? t("nav.quickAdd") : typeLabel(kind);

  return (
    <>
      <Button
        type="button"
        className="fixed bottom-20 right-4 z-30 shadow-lg"
        onClick={openFlow}
        aria-haspopup="dialog"
      >
        {t("nav.quickAdd")}
      </Button>

      <BottomSheet open={open} onClose={close} title={sheetTitle}>
        {step === "pick-type" ? (
          <ul className="flex flex-col gap-2">
            {TYPE_OPTIONS.map((option) => (
              <li key={option}>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => pickType(option)}
                >
                  {typeLabel(option)}
                </Button>
              </li>
            ))}
          </ul>
        ) : kind !== null ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <TextField
              label={titleLabel(kind)}
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              error={titleError}
              autoFocus
            />
            {kind === "shopping" ? (
              <TextField
                label={t("field.quantity")}
                value={form.quantity}
                onChange={(e) => updateForm({ quantity: e.target.value })}
              />
            ) : null}
            {kind === "book" ? (
              <TextField
                label={t("field.author")}
                value={form.author}
                onChange={(e) => updateForm({ author: e.target.value })}
              />
            ) : null}
            {kind === "book" || kind === "movie" ? (
              <TextField
                label={t("field.recommendedBy")}
                value={form.recommendedBy}
                onChange={(e) => updateForm({ recommendedBy: e.target.value })}
              />
            ) : null}
            {kind === "book" || kind === "movie" || kind === "recipe" ? (
              <TextField
                label={t("field.notes")}
                value={form.notes}
                onChange={(e) => updateForm({ notes: e.target.value })}
              />
            ) : null}
            <Button type="submit" disabled={submitting}>
              {t("action.add")}
            </Button>
          </form>
        ) : null}
      </BottomSheet>
    </>
  );
}
