"use client";

import { useEffect, useId, useState } from "react";
import type { Cookbook } from "@/domain/cookbook";
import { getCookbookUseCases } from "@/composition/client";
import { exactTitleMatch } from "@/application/cookbooks/search-cookbooks";
import { t } from "@/i18n";
import { TextField } from "@/components/ui/TextField";

export type CookbookComboboxProps = {
  query: string;
  selectedId: string | null;
  onQueryChange: (query: string) => void;
  onSelect: (cookbook: Cookbook | null, pendingTitle: string | null) => void;
};

export function CookbookCombobox({
  query,
  selectedId,
  onQueryChange,
  onSelect,
}: CookbookComboboxProps) {
  const listId = useId();
  const [options, setOptions] = useState<Cookbook[]>([]);
  const [allCookbooks, setAllCookbooks] = useState<Cookbook[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void getCookbookUseCases().then(async (useCases) => {
      const refresh = async () => {
        const list = await useCases.listCookbooks();
        if (cancelled) return;
        setAllCookbooks(list);
        const matches = await useCases.searchCookbooks(query);
        if (!cancelled) setOptions(matches);
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
  }, [query]);

  const trimmed = query.trim();
  const showCreate =
    trimmed.length > 0 && exactTitleMatch(allCookbooks, trimmed) === undefined;
  const showList = expanded && (options.length > 0 || showCreate);

  return (
    <div className="relative">
      <TextField
        label={t("recipe.source.cookbook")}
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setExpanded(true);
          if (event.target.value.trim() === "") {
            onSelect(null, null);
          }
        }}
        onFocus={() => setExpanded(true)}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-sm"
        >
          {options.map((cookbook) => (
            <li
              key={cookbook.id}
              role="option"
              aria-selected={selectedId === cookbook.id}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-surface"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(cookbook, null);
                onQueryChange(cookbook.title);
                setExpanded(false);
              }}
            >
              {cookbook.title}
              {cookbook.author ? (
                <span className="text-muted"> — {cookbook.author}</span>
              ) : null}
            </li>
          ))}
          {showCreate ? (
            <li
              role="option"
              className="cursor-pointer px-3 py-2 text-sm font-medium text-accent hover:bg-surface"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(null, trimmed);
                onQueryChange(trimmed);
                setExpanded(false);
              }}
            >
              {t("recipe.source.create").replace("{query}", trimmed)}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
