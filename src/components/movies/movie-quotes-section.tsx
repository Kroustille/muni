"use client";

import { useCallback, useEffect, useState } from "react";

import type { MovieQuoteUseCases } from "@/application/movies/movie-quotes";
import type { MovieQuote } from "@/domain/movie-quote";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type MovieQuotesSectionProps = {
  movieItemId: string;
  useCases: MovieQuoteUseCases;
};

type Draft = {
  text: string;
  context: string;
};

const emptyDraft = (): Draft => ({ text: "", context: "" });

export function MovieQuotesSection({ movieItemId, useCases }: MovieQuotesSectionProps) {
  const [quotes, setQuotes] = useState<MovieQuote[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setQuotes(await useCases.listQuotes(movieItemId));
  }, [movieItemId, useCases]);

  useEffect(() => {
    void refresh();
    return useCases.subscribe(movieItemId, () => {
      void refresh();
    });
  }, [movieItemId, refresh, useCases]);

  const saveDraft = async () => {
    const text = draft.text.trim();
    if (text === "") return;
    const context = draft.context.trim() === "" ? null : draft.context.trim();
    setBusy(true);
    try {
      if (editingId === null) {
        await useCases.addQuote(movieItemId, { text, context });
      } else {
        await useCases.updateQuote(editingId, { text, context });
      }
      setDraft(emptyDraft());
      setEditingId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (quote: MovieQuote) => {
    setEditingId(quote.id);
    setDraft({
      text: quote.text,
      context: quote.context ?? "",
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
      <h2 className="text-base font-semibold">{t("movies.quotes.title")}</h2>
      <ul className="flex flex-col gap-3">
        {quotes.map((quote) => (
          <li
            key={quote.id}
            className="rounded-lg border border-border bg-surface p-3 text-sm"
          >
            <p className="whitespace-pre-wrap">{quote.text}</p>
            {quote.context ? (
              <p className="mt-1 text-muted">
                {t("movies.quotes.context")} {quote.context}
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
          label={editingId === null ? t("movies.quotes.add") : t("action.edit")}
          value={draft.text}
          onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
          autoComplete="off"
        />
        <TextField
          label={t("movies.quotes.context")}
          value={draft.context}
          onChange={(event) => setDraft((prev) => ({ ...prev, context: event.target.value }))}
          autoComplete="off"
        />
        <div className="flex gap-2">
          <Button type="button" disabled={busy || draft.text.trim() === ""} onClick={() => void saveDraft()}>
            {editingId === null ? t("movies.quotes.add") : t("action.save")}
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
