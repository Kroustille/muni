"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/domain/item";
import { collectLibraryTags } from "@/application/books/book-library-filters";
import { getItemUseCases } from "@/composition/client";
import { ItemDetailForm } from "@/components/items/ItemDetailForm";
import { useUndoDelete } from "@/components/UndoToast";
import { t } from "@/i18n";

export type ItemDetailPanelProps = {
  itemId: string;
  onUpdated?: () => void;
};

export function ItemDetailPanel({ itemId, onUpdated }: ItemDetailPanelProps) {
  const { deleteWithUndo, isPendingUndo } = useUndoDelete();
  const [item, setItem] = useState<Item | null | undefined>(undefined);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getItemUseCases().then(async (useCases) => {
      const next = await useCases.getItem(itemId);
      if (cancelled) return;
      if (next === undefined || (next.deletedAt !== null && !isPendingUndo(itemId))) {
        setItem(null);
        return;
      }
      setItem(next);
    });
    return () => {
      cancelled = true;
    };
  }, [itemId, isPendingUndo]);

  useEffect(() => {
    if (item?.type !== "book") {
      setTagSuggestions([]);
      return;
    }
    let cancelled = false;
    void getItemUseCases().then(async (useCases) => {
      const books = await useCases.listItems("book");
      if (!cancelled) setTagSuggestions(collectLibraryTags(books));
    });
    return () => {
      cancelled = true;
    };
  }, [item?.type, item?.id]);

  if (item === undefined) {
    return <div className="p-4 text-sm text-muted" aria-busy="true">{t("action.loading")}</div>;
  }

  if (item === null) {
    return <p className="p-4 text-sm text-muted">{t("item.notFound")}</p>;
  }

  return (
    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
      <h2 className="mb-4 text-lg">{item.title}</h2>
      <ItemDetailForm
        key={item.id}
        compact
        item={item}
        tagSuggestions={tagSuggestions}
        onSave={async (patch) => {
          const useCases = await getItemUseCases();
          const updated = await useCases.updateItem(itemId, patch);
          setItem(updated);
          onUpdated?.();
          return updated;
        }}
        onLibraryChange={() => {
          void getItemUseCases().then(async (useCases) => {
            const next = await useCases.getItem(itemId);
            if (next) setItem(next);
            onUpdated?.();
          });
        }}
        onDelete={() => void deleteWithUndo(itemId)}
      />
    </div>
  );
}
