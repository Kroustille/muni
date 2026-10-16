"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Item } from "@/domain/item";
import { getItemUseCases } from "@/composition/client";
import { ItemDetailForm } from "@/components/items/ItemDetailForm";
import { useUndoDelete } from "@/components/UndoToast";

export default function ItemDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { deleteWithUndo, isPendingUndo } = useUndoDelete();
  const [item, setItem] = useState<Item | null | undefined>(undefined);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;

    void getItemUseCases().then(async (useCases) => {
      const next = await useCases.getItem(id);
      if (cancelled) return;
      if (next === undefined || (next.deletedAt !== null && !isPendingUndo(id))) {
        setItem(null);
        return;
      }
      setItem(next);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isPendingUndo]);

  if (id === null) {
    notFound();
  }

  if (item === undefined) {
    return <main className="p-4 pb-20" aria-busy="true" />;
  }

  if (item === null) {
    notFound();
  }

  return (
    <main className="p-4 pb-20 md:pb-4">
      <ItemDetailForm
        key={item.id}
        item={item}
        onSave={async (patch) => {
          const useCases = await getItemUseCases();
          const updated = await useCases.updateItem(id, patch);
          setItem(updated);
          return updated;
        }}
        onDelete={() => void deleteWithUndo(id)}
      />
    </main>
  );
}
