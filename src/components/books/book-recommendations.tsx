"use client";

import { suggestBooks } from "@/application/books/recommendations";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";

export type BookRecommendationsProps = {
  libraryBooks: readonly Item[];
  onSelect?: (id: string) => void;
};

export function BookRecommendations({ libraryBooks, onSelect }: BookRecommendationsProps) {
  const suggestions = suggestBooks(libraryBooks);
  if (suggestions.length < 3) return null;

  return (
    <section className="mb-6 rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-lg">{t("books.discovery.recommendations")}</h2>
      <ul className="flex flex-col gap-2">
        {suggestions.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
              onClick={() => onSelect?.(book.id)}
            >
              <span className="font-medium">{book.title}</span>
              {book.author ? (
                <span className="block text-muted">{book.author}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
