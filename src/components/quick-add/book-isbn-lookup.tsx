"use client";

import { useState } from "react";

import { BookCatalogFlow } from "@/components/books/book-catalog-flow";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useIsMobile } from "@/components/use-is-mobile";
import { t } from "@/i18n";

export type BookIsbnLookupProps = {
  onSaved?: () => void;
};

/** Mobile manual ISBN + catalog lookup (reuses scan/preview flow). */
export function BookIsbnLookup({ onSaved }: BookIsbnLookupProps) {
  const isMobile = useIsMobile();
  const [isbn, setIsbn] = useState("");

  if (!isMobile) return null;

  return (
    <BookCatalogFlow onSaved={onSaved} showDefaultTrigger={false}>
      {({ lookupIsbn }) => (
        <div className="flex flex-col gap-2">
          <TextField
            label={t("field.isbn")}
            value={isbn}
            onChange={(event) => setIsbn(event.target.value)}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={isbn.trim() === ""}
            onClick={() => lookupIsbn(isbn.trim())}
          >
            {t("books.lookup.search")}
          </Button>
        </div>
      )}
    </BookCatalogFlow>
  );
}
