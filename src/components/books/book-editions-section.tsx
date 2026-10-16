"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  canUnlinkWorkId,
  collectWorkLinkPatches,
  patchForWorkUnlink,
  workSiblings,
} from "@/application/books/work-grouping";
import { getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TextField } from "@/components/ui/TextField";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";

export type BookEditionsSectionProps = {
  item: Item & { type: "book" };
  onChanged?: () => void;
};

function editionCountLabel(count: number): string {
  return t("books.editions.count").replace("{count}", String(count));
}

export function BookEditionsSection({ item, onChanged }: BookEditionsSectionProps) {
  const [library, setLibrary] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshLibrary = useCallback(async () => {
    const useCases = await getItemUseCases();
    const books = await useCases.listItems("book");
    setLibrary(books);
  }, []);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary, item.id, item.workId]);

  const siblings = useMemo(() => workSiblings(library, item), [library, item]);

  const pickerCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library
      .filter((entry) => entry.type === "book" && entry.id !== item.id && entry.deletedAt === null)
      .filter((entry) => item.workId === null || entry.workId !== item.workId)
      .filter((entry) => q === "" || entry.title.toLowerCase().includes(q));
  }, [library, item, query]);

  const linkTo = useCallback(
    async (targetId: string) => {
      setBusy(true);
      try {
        const useCases = await getItemUseCases();
        const books = await useCases.listItems("book");
        const patches = collectWorkLinkPatches(books, item.id, targetId, crypto.randomUUID());
        for (const { id, patch } of patches) {
          await useCases.updateItem(id, patch);
        }
        setPickerOpen(false);
        setQuery("");
        await refreshLibrary();
        onChanged?.();
      } finally {
        setBusy(false);
      }
    },
    [item.id, onChanged, refreshLibrary],
  );

  const unlink = useCallback(async () => {
    const patch = patchForWorkUnlink(library, item);
    if (!patch) return;
    setBusy(true);
    try {
      const useCases = await getItemUseCases();
      await useCases.updateItem(item.id, patch);
      await refreshLibrary();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }, [item, library, onChanged, refreshLibrary]);

  const showUnlink = canUnlinkWorkId(item.workId) && siblings.length > 0;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("books.editions.other")}</h3>
        {siblings.length > 0 ? (
          <span className="text-xs text-muted">{editionCountLabel(siblings.length + 1)}</span>
        ) : null}
      </div>

      {siblings.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {siblings.map((sibling) => (
            <li key={sibling.id}>
              <Link
                href={`/items/${sibling.id}`}
                className="block rounded-lg border border-border px-2 py-1.5 text-sm hover:bg-surface"
              >
                <span className="font-medium">{sibling.title}</span>
                {sibling.isbn ? (
                  <span className="ml-2 text-xs text-muted">{sibling.isbn}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">—</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => setPickerOpen(true)}>
          {t("books.editions.link")}
        </Button>
        {showUnlink ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void unlink()}>
            {t("books.editions.unlink")}
          </Button>
        ) : null}
      </div>

      <BottomSheet
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setQuery("");
        }}
        title={t("books.editions.link")}
      >
        <div className="flex flex-col gap-3">
          <TextField
            label={t("books.catalog.search.placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {pickerCandidates.length === 0 ? (
              <li className="text-sm text-muted">{t("books.catalog.empty")}</li>
            ) : (
              pickerCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border px-2 py-2 text-left text-sm hover:bg-surface"
                    disabled={busy}
                    onClick={() => void linkTo(candidate.id)}
                  >
                    <span className="font-medium">{candidate.title}</span>
                    {candidate.author ? (
                      <span className="mt-0.5 block text-xs text-muted">{candidate.author}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </BottomSheet>
    </section>
  );
}
