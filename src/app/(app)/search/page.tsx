"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedSearch } from "@/components/use-debounced-search";
import { getSearchUseCase } from "@/composition/client";
import type { Item, ItemType } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

const TYPE_LABEL_KEY: Record<ItemType, MessageKey> = {
  shopping: "type.shopping",
  book: "type.book",
  movie: "type.movie",
  recipe: "type.recipe",
  music_artist: "type.music_artist",
  music_track: "type.music_track",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (): Promise<void> => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }
    const search = await getSearchUseCase();
    const next = await search.search(trimmed);
    setResults(next);
    setSearched(true);
  }, [query]);

  useDebouncedSearch(query, true, runSearch);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  return (
    <main className="mx-auto w-full max-w-xl p-4 pb-20 md:max-w-4xl md:pb-4">
      <h1 className="mb-4 text-[1.35rem]">{t("nav.search")}</h1>
      <form
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            className="min-h-11 w-full rounded-xl border border-border bg-surface py-2 pr-3 pl-10 text-foreground"
          />
        </div>
      </form>
      {searched && results.length === 0 ? (
        <p className="text-muted">{t("search.empty")}</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-surface px-3 py-2"
            >
              <Link href={`/items/${item.id}`} className="font-medium underline-offset-2 hover:underline">
                {item.title}
              </Link>
              <p className="text-sm text-muted">{t(TYPE_LABEL_KEY[item.type])}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
