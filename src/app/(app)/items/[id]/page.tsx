"use client";

import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ItemPatch } from "@/domain/item";
import type { Item } from "@/domain/item";
import { getItemUseCases } from "@/composition/client";
import {
  BookFields,
  type BookFieldValues,
  MovieFields,
  type MovieFieldValues,
  RecipeFields,
  type RecipeFieldValues,
  ShoppingFields,
  type ShoppingFieldValues,
} from "@/components/fields";
import { Button } from "@/components/ui/Button";
import { useUndoDelete } from "@/components/UndoToast";
import { t } from "@/i18n";

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function itemToShoppingValues(item: Item): ShoppingFieldValues {
  return {
    title: item.title,
    quantity: item.quantity ?? "",
  };
}

function shoppingValuesToPatch(values: ShoppingFieldValues): ItemPatch {
  return {
    title: values.title.trim(),
    quantity: optionalText(values.quantity),
  };
}

function itemToBookValues(item: Item): BookFieldValues {
  return {
    title: item.title,
    author: item.author ?? "",
    status: item.status as BookFieldValues["status"],
    rating: item.rating,
    recommendedBy: item.recommendedBy ?? "",
    notes: item.notes ?? "",
  };
}

function bookValuesToPatch(values: BookFieldValues): ItemPatch {
  const patch: ItemPatch = {
    title: values.title.trim(),
    author: optionalText(values.author),
    status: values.status,
    recommendedBy: optionalText(values.recommendedBy),
    notes: optionalText(values.notes),
  };
  if (values.status === "read") {
    patch.rating = values.rating;
  }
  return patch;
}

function itemToMovieValues(item: Item): MovieFieldValues {
  return {
    title: item.title,
    status: item.status as MovieFieldValues["status"],
    rating: item.rating,
    recommendedBy: item.recommendedBy ?? "",
    notes: item.notes ?? "",
  };
}

function movieValuesToPatch(values: MovieFieldValues): ItemPatch {
  const patch: ItemPatch = {
    title: values.title.trim(),
    status: values.status,
    recommendedBy: optionalText(values.recommendedBy),
    notes: optionalText(values.notes),
  };
  if (values.status === "watched") {
    patch.rating = values.rating;
  }
  return patch;
}

function itemToRecipeValues(item: Item): RecipeFieldValues {
  return {
    title: item.title,
    ingredients: item.ingredients ?? [],
    steps: item.steps ?? [],
    notes: item.notes ?? "",
  };
}

function recipeValuesToPatch(values: RecipeFieldValues): ItemPatch {
  const ingredients = values.ingredients
    .map((row) => ({ quantity: row.quantity.trim(), name: row.name.trim() }))
    .filter((row) => row.quantity !== "" || row.name !== "");
  const steps = values.steps.map((step) => step.trim()).filter((step) => step !== "");
  return {
    title: values.title.trim(),
    notes: optionalText(values.notes),
    ingredients: ingredients.length === 0 ? null : ingredients,
    steps: steps.length === 0 ? null : steps,
  };
}

type FieldValues = ShoppingFieldValues | BookFieldValues | MovieFieldValues | RecipeFieldValues;

function valuesFromItem(item: Item): FieldValues {
  switch (item.type) {
    case "shopping":
      return itemToShoppingValues(item);
    case "book":
      return itemToBookValues(item);
    case "movie":
      return itemToMovieValues(item);
    case "recipe":
      return itemToRecipeValues(item);
  }
}

function patchFromValues(item: Item, values: FieldValues): ItemPatch {
  switch (item.type) {
    case "shopping":
      return shoppingValuesToPatch(values as ShoppingFieldValues);
    case "book":
      return bookValuesToPatch(values as BookFieldValues);
    case "movie":
      return movieValuesToPatch(values as MovieFieldValues);
    case "recipe":
      return recipeValuesToPatch(values as RecipeFieldValues);
  }
}

export default function ItemDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { deleteWithUndo, isPendingUndo } = useUndoDelete();
  const [item, setItem] = useState<Item | null | undefined>(undefined);
  const [values, setValues] = useState<FieldValues | null>(null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;

    void getItemUseCases().then(async (useCases) => {
      const next = await useCases.getItem(id);
      if (cancelled) return;
      if (next === undefined || (next.deletedAt !== null && !isPendingUndo(id))) {
        setItem(null);
        setValues(null);
        return;
      }
      setItem(next);
      setValues((current) => (current === null ? valuesFromItem(next) : current));
    });

    return () => {
      cancelled = true;
    };
  }, [id, isPendingUndo]);

  const save = useCallback(async () => {
    if (id === null || item == null || values === null) return;
    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      setTitleError(t("validation.titleRequired"));
      return;
    }
    setSaving(true);
    setTitleError(undefined);
    try {
      const useCases = await getItemUseCases();
      const updated = await useCases.updateItem(id, patchFromValues(item, values));
      setItem(updated);
      setValues(valuesFromItem(updated));
    } finally {
      setSaving(false);
    }
  }, [id, item, values]);

  if (id === null) {
    notFound();
  }

  if (item === undefined || values === null) {
    return <main className="p-4 pb-20" aria-busy="true" />;
  }

  if (item === null) {
    notFound();
  }

  return (
    <main className="p-4 pb-20">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {item.type === "shopping" ? (
          <ShoppingFields
            values={values as ShoppingFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
        ) : null}
        {item.type === "book" ? (
          <BookFields
            values={values as BookFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
        ) : null}
        {item.type === "movie" ? (
          <MovieFields
            values={values as MovieFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
        ) : null}
        {item.type === "recipe" ? (
          <RecipeFields
            values={values as RecipeFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={saving}>
            {t("action.save")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void deleteWithUndo(id)}
          >
            {t("action.delete")}
          </Button>
        </div>
      </form>
    </main>
  );
}
