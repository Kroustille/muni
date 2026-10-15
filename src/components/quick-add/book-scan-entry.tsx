"use client";

import { BookCatalogFlow } from "@/components/books/book-catalog-flow";
import { BookTitleCatalogFlow } from "@/components/books/book-title-catalog-flow";
import { useIsMobile } from "@/components/use-is-mobile";

export type BookScanEntryProps = {
  onSaved?: () => void;
};

/** Book catalog entry for quick-add: title search on all devices; scan/ISBN on mobile (N3). */
export function BookScanEntry({ onSaved }: BookScanEntryProps) {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-wrap gap-2">
      {isMobile ? <BookCatalogFlow onSaved={onSaved} showDefaultTrigger /> : null}
      <BookTitleCatalogFlow onSaved={onSaved} />
    </div>
  );
}
