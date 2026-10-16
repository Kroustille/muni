"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type TagChipEditorProps = {
  tags: string[];
  suggestions: readonly string[];
  onChange: (tags: string[]) => void;
};

export function TagChipEditor({ tags, suggestions, onChange }: TagChipEditorProps) {
  const [draft, setDraft] = useState("");

  const filteredSuggestions = useMemo(() => {
    const needle = draft.trim().toLowerCase();
    if (needle === "") return [];
    return suggestions
      .filter((tag) => !tags.includes(tag) && tag.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [draft, suggestions, tags]);

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (next === "" || tags.includes(next)) return;
    onChange([...tags, next]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted">{t("books.tags")}</span>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm"
              onClick={() => onChange(tags.filter((value) => value !== tag))}
              aria-label={`${t("books.tags")}: ${tag}`}
            >
              <span>{tag}</span>
              <span aria-hidden>×</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <TextField
            label={t("books.tags.add")}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            list="book-tag-suggestions"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag(draft);
              }
            }}
            autoComplete="off"
          />
          <Button type="button" variant="secondary" className="self-end" onClick={() => addTag(draft)}>
            {t("books.tags.add")}
          </Button>
        </div>
        {filteredSuggestions.length > 0 ? (
          <ul className="flex flex-wrap gap-1" role="listbox" aria-label={t("books.tags")}>
            {filteredSuggestions.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  className="rounded-lg border border-border px-2 py-1 text-sm"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <datalist id="book-tag-suggestions">
          {suggestions.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
