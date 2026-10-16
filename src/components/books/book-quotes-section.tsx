"use client";

import { useCallback, useEffect, useState } from "react";

import type { BookQuoteUseCases } from "@/application/books/book-quotes";
import type { BookQuote } from "@/domain/book-quote";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type BookQuotesSectionProps = {
  bookItemId: string;
  useCases: BookQuoteUseCases;
};

type Draft = {
  text: string;
  page: string;
};

const emptyDraft = (): Draft => ({ text: "", page: "" });

export function BookQuotesSection({ bookItemId, useCases }: BookQuotesSectionProps) {
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setQuotes(await useCases.listQuotes(bookItemId));
  }, [bookItemId, useCases]);

  useEffect(() => {
    void refresh();
    return useCases.subscribe(bookItemId, () => {
      void refresh();
    });
  }, [bookItemId, refresh, useCases]);

  const parsePage = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
  };

  const saveDraft = async () => {
    const text = draft.text.trim();
    if (text === "") return;
    setBusy(true);
    try {
      const page = parsePage(draft.page);
      if (editingId === null) {
        await useCases.addQuote(bookItemId, { text, page });
      } else {
        await useCases.updateQuote(editingId, { text, page });
      }
      setDraft(emptyDraft());
      setEditingId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (quote: BookQuote) => {
    setEditingId(quote.id);
    setDraft({
      text: quote.text,
      page: quote.page === null ? "" : String(quote.page),
    });
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await useCases.deleteQuote(id);
      if (editingId === id) {
        setEditingId(null);
        setDraft(emptyDraft());
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("books.quotes.title")}</h2>
      <ul className="flex flex-col gap-3">
        {quotes.map((quote) => (
          <li
            key={quote.id}
            className="rounded-lg border border-border bg-surface p-3 text-sm"
          >
            <p className="whitespace-pre-wrap">{quote.text}</p>
            {quote.page !== null ? (
              <p className="mt-1 text-muted">
                {t("books.quotes.page")} {quote.page}
              </p>
            ) : null}
            <div className="mt-2 flex gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => startEdit(quote)}>
                {t("action.edit")}
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={() => void remove(quote.id)}>
                {t("action.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <TextField
          label={editingId === null ? t("books.quotes.add") : t("action.edit")}
          value={draft.text}
          onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
          autoComplete="off"
        />
        <TextField
          label={t("books.quotes.page")}
          value={draft.page}
          onChange={(event) => setDraft((prev) => ({ ...prev, page: event.target.value }))}
          inputMode="numeric"
          autoComplete="off"
        />
        <div className="flex gap-2">
          <Button type="button" disabled={busy || draft.text.trim() === ""} onClick={() => void saveDraft()}>
            {editingId === null ? t("books.quotes.add") : t("action.save")}
          </Button>
          {editingId !== null ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setEditingId(null);
                setDraft(emptyDraft());
              }}
            >
              {t("action.cancel")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
