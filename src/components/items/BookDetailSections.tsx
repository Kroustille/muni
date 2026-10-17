"use client";

import { useEffect, useState } from "react";
import type { BookQuoteUseCases } from "@/application/books/book-quotes";
import type { Item, ItemPatch } from "@/domain/item";
import { BookFields, type BookFieldValues } from "@/components/fields";
import { BookEditionsSection } from "@/components/books/book-editions-section";
import {
  BookDiscoveryFields,
  emptyBookDiscoveryFieldValues,
  itemToBookDiscoveryValues,
  type BookDiscoveryFieldValues,
} from "@/components/books/book-discovery-fields";
import { BookQuotesSection } from "@/components/books/book-quotes-section";
import { getBookQuoteUseCases, getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";
import {
  bookLoanReturnPatch,
  clearBookLoanInValues,
  type FieldValues,
  valuesFromItem,
} from "./item-detail-shared";

export type BookDetailSectionsProps = {
  item: Item & { type: "book" };
  values: FieldValues;
  discoveryValues: BookDiscoveryFieldValues;
  onValuesChange: (next: FieldValues) => void;
  onDiscoveryChange: (next: BookDiscoveryFieldValues) => void;
  onSave: (patch: ItemPatch) => Promise<Item>;
  onLibraryChange?: () => void;
  tagSuggestions?: readonly string[];
  titleError?: string;
  pagesReadError?: string;
  loanError?: string;
  onClearTitleError: () => void;
  onClearPagesReadError: () => void;
  onClearLoanError: () => void;
};

export function BookDetailSections({
  item,
  values,
  discoveryValues,
  onValuesChange,
  onDiscoveryChange,
  onSave,
  onLibraryChange,
  tagSuggestions,
  titleError,
  pagesReadError,
  loanError,
  onClearTitleError,
  onClearPagesReadError,
  onClearLoanError,
}: BookDetailSectionsProps) {
  const [bookQuoteUseCases, setBookQuoteUseCases] = useState<BookQuoteUseCases | null>(null);
  const bookValues = values as BookFieldValues;

  useEffect(() => {
    void getBookQuoteUseCases().then(setBookQuoteUseCases);
  }, []);

  return (
    <>
      <BookFields
        values={bookValues}
        pageCount={item.pageCount}
        tagSuggestions={tagSuggestions}
        onChange={(next) => {
          onValuesChange(next);
          onClearTitleError();
          onClearPagesReadError();
        }}
        titleError={titleError}
        pagesReadError={pagesReadError}
      />
      <section className="flex flex-col gap-4 border-t border-border pt-4">
        <h2 className="text-base font-medium">{t("books.loan.title")}</h2>
        <TextField
          label={t("books.loan.to")}
          value={bookValues.loanedTo}
          onChange={(event) => {
            onValuesChange({ ...bookValues, loanedTo: event.target.value });
            onClearLoanError();
          }}
          error={loanError}
          autoComplete="off"
        />
        <TextField
          label={t("books.loan.since")}
          type="date"
          value={bookValues.loanedAt}
          onChange={(event) => {
            onValuesChange({ ...bookValues, loanedAt: event.target.value });
            onClearLoanError();
          }}
          autoComplete="off"
        />
        {bookValues.loanedTo.trim() !== "" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onValuesChange(clearBookLoanInValues(bookValues));
              void onSave(bookLoanReturnPatch()).then((updated) => {
                onValuesChange(valuesFromItem(updated));
              });
            }}
          >
            {t("books.loan.return")}
          </Button>
        ) : null}
      </section>
      <BookEditionsSection
        item={item}
        onChanged={async () => {
          const useCases = await getItemUseCases();
          const refreshed = await useCases.getItem(item.id);
          if (refreshed) onValuesChange(valuesFromItem(refreshed));
          onLibraryChange?.();
        }}
      />
      {bookQuoteUseCases !== null ? (
        <BookQuotesSection bookItemId={item.id} useCases={bookQuoteUseCases} />
      ) : null}
      <BookDiscoveryFields values={discoveryValues} onChange={onDiscoveryChange} />
    </>
  );
}

export { emptyBookDiscoveryFieldValues, itemToBookDiscoveryValues };
