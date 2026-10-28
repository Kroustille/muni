"use client";

import type { CreateItemExtra, RecipeSourcePayload } from "@/application/items";
import type { Ingredient } from "@/domain/item";
import type { Cookbook } from "@/domain/cookbook";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";
import { RecipeSourceSection } from "@/components/recipe/recipe-source-section";

import { CookbookCombobox } from "./cookbook-combobox";
import { MultilineField } from "./multiline-field";

export type RecipeFieldValues = {
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  notes: string;
  cookbookId: string | null;
  cookbookQuery: string;
  pendingCookbookTitle: string | null;
  sourcePage: string;
  cookbookAuthor: string;
  cookbookIsbn: string;
  sourceSectionOpen: boolean;
};

export const emptyRecipeFieldValues = (): RecipeFieldValues => ({
  title: "",
  ingredients: [],
  steps: [],
  notes: "",
  cookbookId: null,
  cookbookQuery: "",
  pendingCookbookTitle: null,
  sourcePage: "",
  cookbookAuthor: "",
  cookbookIsbn: "",
  sourceSectionOpen: false,
});

export type RecipeFieldsProps = {
  values: RecipeFieldValues;
  onChange: (values: RecipeFieldValues) => void;
  titleError?: string;
  defaultSourceCollapsed?: boolean;
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

export function recipeSourcePayloadFromValues(values: RecipeFieldValues): RecipeSourcePayload {
  return {
    cookbookId: values.cookbookId,
    sourcePage: optionalText(values.sourcePage),
    pendingCookbookTitle: values.pendingCookbookTitle,
    cookbookAuthor: optionalText(values.cookbookAuthor),
    cookbookIsbn: optionalText(values.cookbookIsbn),
  };
}

export function RecipeFields({
  values,
  onChange,
  titleError,
  defaultSourceCollapsed = true,
}: RecipeFieldsProps) {
  const sourceOpen =
    values.sourceSectionOpen ||
    (!defaultSourceCollapsed && values.cookbookId !== null) ||
    values.cookbookQuery.trim() !== "";

  const hasCookbookSelection =
    values.cookbookId !== null || values.pendingCookbookTitle !== null;

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

  const handleCookbookSelect = (cookbook: Cookbook | null, pendingTitle: string | null) => {
    if (pendingTitle) {
      onChange({
        ...values,
        cookbookId: null,
        pendingCookbookTitle: pendingTitle,
        cookbookQuery: pendingTitle,
        cookbookAuthor: "",
        cookbookIsbn: "",
        sourceSectionOpen: true,
      });
      return;
    }
    if (cookbook === null) {
      onChange({
        ...values,
        cookbookId: null,
        pendingCookbookTitle: null,
        cookbookQuery: "",
        sourcePage: "",
        cookbookAuthor: "",
        cookbookIsbn: "",
      });
      return;
    }
    onChange({
      ...values,
      cookbookId: cookbook.id,
      pendingCookbookTitle: null,
      cookbookQuery: cookbook.title,
      cookbookAuthor: cookbook.author ?? "",
      cookbookIsbn: cookbook.isbn ?? "",
      sourceSectionOpen: true,
    });
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

      <details
        className="rounded-lg border border-border p-3"
        open={sourceOpen}
        onToggle={(event) => {
          onChange({
            ...values,
            sourceSectionOpen: (event.currentTarget as HTMLDetailsElement).open,
          });
        }}
      >
        <summary className="cursor-pointer font-medium text-foreground">
          {t("recipe.source.section")}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-muted">{t("recipe.source.help")}</p>
          <CookbookCombobox
            query={values.cookbookQuery}
            selectedId={values.cookbookId}
            onQueryChange={(cookbookQuery) =>
              onChange({ ...values, cookbookQuery, sourceSectionOpen: true })
            }
            onSelect={handleCookbookSelect}
          />
          <TextField
            label={t("recipe.source.page")}
            value={values.sourcePage}
            onChange={(event) => onChange({ ...values, sourcePage: event.target.value })}
            disabled={!hasCookbookSelection}
            autoComplete="off"
          />
          {hasCookbookSelection ? (
            <>
              <TextField
                label={t("recipe.source.author")}
                value={values.cookbookAuthor}
                onChange={(event) => onChange({ ...values, cookbookAuthor: event.target.value })}
                autoComplete="off"
              />
              <TextField
                label={t("recipe.source.isbn")}
                value={values.cookbookIsbn}
                onChange={(event) => onChange({ ...values, cookbookIsbn: event.target.value })}
                autoComplete="off"
              />
            </>
          ) : null}
        </div>
      </details>

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

      {values.cookbookId ? (
        <RecipeSourceSection
          cookbookId={values.cookbookId}
          sourcePage={optionalText(values.sourcePage)}
        />
      ) : null}

      <MultilineField
        label={t("field.notes")}
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
    </div>
  );
}
