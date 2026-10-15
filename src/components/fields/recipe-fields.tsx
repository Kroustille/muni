"use client";

import type { CreateItemExtra } from "@/application/items";
import type { Ingredient } from "@/domain/item";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

import { MultilineField } from "./multiline-field";

export type RecipeFieldValues = {
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  notes: string;
};

export const emptyRecipeFieldValues = (): RecipeFieldValues => ({
  title: "",
  ingredients: [],
  steps: [],
  notes: "",
});

export type RecipeFieldsProps = {
  values: RecipeFieldValues;
  onChange: (values: RecipeFieldValues) => void;
  titleError?: string;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizedIngredients(rows: Ingredient[]): Ingredient[] | null {
  const cleaned = rows
    .map((row) => ({ quantity: row.quantity.trim(), name: row.name.trim() }))
    .filter((row) => row.quantity !== "" || row.name !== "");
  return cleaned.length === 0 ? null : cleaned;
}

function normalizedSteps(rows: string[]): string[] | null {
  const cleaned = rows.map((step) => step.trim()).filter((step) => step !== "");
  return cleaned.length === 0 ? null : cleaned;
}

export function recipeFieldValuesToExtra(values: RecipeFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = {};
  const notes = optionalText(values.notes);
  if (notes) extra.notes = notes;
  const ingredients = normalizedIngredients(values.ingredients);
  if (ingredients) extra.ingredients = ingredients;
  const steps = normalizedSteps(values.steps);
  if (steps) extra.steps = steps;
  return extra;
}

export function RecipeFields({ values, onChange, titleError }: RecipeFieldsProps) {
  const updateIngredient = (index: number, patch: Partial<Ingredient>) => {
    const ingredients = values.ingredients.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    onChange({ ...values, ingredients });
  };

  const updateStep = (index: number, step: string) => {
    const steps = values.steps.map((value, i) => (i === index ? step : value));
    onChange({ ...values, steps });
  };

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t("field.title")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
        autoComplete="off"
      />

      <section role="group" aria-label={t("field.ingredients")} className="flex flex-col gap-2">
        <p className="text-sm text-muted">{t("field.ingredients")}</p>
        <ul className="flex flex-col gap-3">
          {values.ingredients.map((row, index) => (
            <li key={index} className="flex flex-col gap-2 sm:flex-row">
              <TextField
                label={t("field.quantity")}
                value={row.quantity}
                onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                className="sm:flex-1"
                autoComplete="off"
              />
              <TextField
                label={t("field.name")}
                value={row.name}
                onChange={(event) => updateIngredient(index, { name: event.target.value })}
                className="sm:flex-[2]"
                autoComplete="off"
              />
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange({
              ...values,
              ingredients: [...values.ingredients, { quantity: "", name: "" }],
            })
          }
        >
          {t("action.addIngredient")}
        </Button>
      </section>

      <section role="group" aria-label={t("field.steps")} className="flex flex-col gap-2">
        <p className="text-sm text-muted">{t("field.steps")}</p>
        <div className="flex flex-col gap-2">
          {values.steps.map((step, index) => (
            <MultilineField
              key={index}
              label={`${t("field.steps")} ${index + 1}`}
              value={step}
              onChange={(event) => updateStep(index, event.target.value)}
              rows={2}
              className="min-h-16"
            />
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange({ ...values, steps: [...values.steps, ""] })}
        >
          {t("action.addStep")}
        </Button>
      </section>

      <MultilineField
        label={t("field.notes")}
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
    </div>
  );
}
