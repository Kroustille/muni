"use client";

import Link from "next/link";
import { useState } from "react";
import { getSearchUseCase } from "@/composition/client";
import type { Item, ItemType } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

const TYPE_LABEL_KEY: Record<ItemType, MessageKey> = {
  shopping: "type.shopping",
  book: "type.book",
  movie: "type.movie",
  recipe: "type.recipe",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [searched, setSearched] = useState(false);

  async function runSearch(): Promise<void> {
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
  }

  return (
    <main className="mx-auto max-w-xl p-4 pb-20">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.search")}</h1>
      <form
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-black"
        />
      </form>
      {searched && results.length === 0 ? (
        <p>{t("search.empty")}</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((item) => (
            <li key={item.id} className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10">
              <Link href={`/items/${item.id}`} className="font-medium underline-offset-2 hover:underline">
                {item.title}
              </Link>
              <p className="text-sm opacity-70">{t(TYPE_LABEL_KEY[item.type])}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
