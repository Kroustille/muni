"use client";

import { useEffect, useId, useState } from "react";
import { getItemUseCases } from "@/composition/client";
import { t, type MessageKey } from "@/i18n";
import { TextField } from "@/components/ui/TextField";

const recommendedByLabelKey = "field.recommendedBy" as MessageKey;

export type RecommendedByInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RecommendedByInput({ value, onChange }: RecommendedByInputProps) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void getItemUseCases().then(async (useCases) => {
      const refresh = async () => {
        const names = await useCases.recommenders(value);
        if (!cancelled) setSuggestions(names);
      };
      await refresh();
      unsubscribe = useCases.subscribe(() => {
        void refresh();
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [value]);

  const showSuggestions = value.length > 0 && suggestions.length > 0;

  return (
    <div className="relative">
      <TextField
        label={t(recommendedByLabelKey)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? listId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showSuggestions ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-sm"
        >
          {suggestions.map((name) => (
            <li
              key={name}
              role="option"
              aria-selected={value === name}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-surface"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(name);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
