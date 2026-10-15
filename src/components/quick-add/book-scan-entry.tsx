"use client";

import { BookCatalogFlow } from "@/components/books/book-catalog-flow";
import { useIsMobile } from "@/components/use-is-mobile";

export type BookScanEntryProps = {
  onSaved?: () => void;
};

/** Mobile-only ISBN scanner entry for the book quick-add flow (N3). */
export function BookScanEntry({ onSaved }: BookScanEntryProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return <BookCatalogFlow onSaved={onSaved} showDefaultTrigger />;
}
