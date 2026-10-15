"use client";

import { useCallback, useState } from "react";
import type { ItemType } from "@/domain/item";
import { getItemUseCases } from "@/composition/client";
import { t } from "@/i18n";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { BookIsbnLookup } from "@/components/quick-add/book-isbn-lookup";
import { BookScanEntry } from "@/components/quick-add/book-scan-entry";
import {
  BookFields,
  bookFieldValuesToExtra,
  emptyBookFieldValues,
  type BookFieldValues,
  MovieFields,
  movieFieldValuesToExtra,
  emptyMovieFieldValues,
  type MovieFieldValues,
  RecipeFields,
  recipeFieldValuesToExtra,
  emptyRecipeFieldValues,
  type RecipeFieldValues,
  ShoppingFields,
  shoppingFieldValuesToExtra,
  emptyShoppingFieldValues,
  type ShoppingFieldValues,
} from "@/components/fields";

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

type FieldValues =
  | ShoppingFieldValues
  | BookFieldValues
  | MovieFieldValues
  | RecipeFieldValues;

function emptyFields(kind: ItemKind): FieldValues {
  switch (kind) {
    case "shopping":
      return emptyShoppingFieldValues();
    case "book":
      return emptyBookFieldValues();
    case "movie":
      return emptyMovieFieldValues();
    case "recipe":
      return emptyRecipeFieldValues();
  }
}

function titleFromValues(values: FieldValues): string {
  return values.title;
}

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick-type" | "form">("pick-type");
  const [kind, setKind] = useState<ItemKind | null>(null);
  const [values, setValues] = useState<FieldValues>(emptyShoppingFieldValues());
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setStep("pick-type");
    setKind(null);
    setValues(emptyShoppingFieldValues());
    setTitleError(undefined);
    setSubmitting(false);
  }, []);

  const openFlow = useCallback(() => {
    setOpen(true);
    setStep("pick-type");
    setKind(null);
    setValues(emptyShoppingFieldValues());
    setTitleError(undefined);
  }, []);

  const pickType = useCallback((next: ItemKind) => {
    setKind(next);
    setValues(emptyFields(next));
    setTitleError(undefined);
    setStep("form");
  }, []);

  const updateValues = useCallback((next: FieldValues) => {
    setValues(next);
    setTitleError(undefined);
  }, []);

  const submit = useCallback(async () => {
    if (kind === null) return;
    const trimmedTitle = titleFromValues(values).trim();
    if (!trimmedTitle) {
      setTitleError(t("validation.titleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const useCases = await getItemUseCases();
      switch (kind) {
        case "shopping":
          await useCases.createItem(
            kind,
            trimmedTitle,
            shoppingFieldValuesToExtra(values as ShoppingFieldValues),
          );
          break;
        case "book":
          await useCases.createItem(
            kind,
            trimmedTitle,
            bookFieldValuesToExtra(values as BookFieldValues),
          );
          break;
        case "movie":
          await useCases.createItem(
            kind,
            trimmedTitle,
            movieFieldValuesToExtra(values as MovieFieldValues),
          );
          break;
        case "recipe":
          await useCases.createItem(
            kind,
            trimmedTitle,
            recipeFieldValuesToExtra(values as RecipeFieldValues),
          );
          break;
      }
      close();
    } catch {
      setTitleError(t("validation.titleRequired"));
      setSubmitting(false);
    }
  }, [close, kind, values]);

  const sheetTitle =
    step === "pick-type" || kind === null ? t("nav.quickAdd") : typeLabel(kind);

  const renderFields = () => {
    if (kind === null) return null;
    switch (kind) {
      case "shopping":
        return (
          <ShoppingFields
            values={values as ShoppingFieldValues}
            onChange={updateValues}
            titleError={titleError}
          />
        );
      case "book":
        return (
          <>
            <BookScanEntry onSaved={close} />
            <BookIsbnLookup onSaved={close} />
            <BookFields
              values={values as BookFieldValues}
              onChange={updateValues}
              titleError={titleError}
            />
          </>
        );
      case "movie":
        return (
          <MovieFields
            values={values as MovieFieldValues}
            onChange={updateValues}
            titleError={titleError}
          />
        );
      case "recipe":
        return (
          <RecipeFields
            values={values as RecipeFieldValues}
            onChange={updateValues}
            titleError={titleError}
          />
        );
    }
  };

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
            {renderFields()}
            <Button type="submit" disabled={submitting}>
              {t("action.add")}
            </Button>
          </form>
        ) : null}
      </BottomSheet>
    </>
  );
}
