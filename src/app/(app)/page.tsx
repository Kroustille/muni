"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getItemUseCases } from "@/composition/client";
import type { Item, ItemType } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

type ListRoute = "shopping" | "books" | "movies" | "recipes";
type MusicRoute = "musicArtists" | "musicTracks";

const LIST_ROUTES: ListRoute[] = ["shopping", "books", "movies", "recipes"];
const MUSIC_ROUTES: MusicRoute[] = ["musicArtists", "musicTracks"];

const ROUTE_TO_TYPE: Record<ListRoute, ItemType> = {
  shopping: "shopping",
  books: "book",
  movies: "movie",
  recipes: "recipe",
};

const ROUTE_TITLE_KEY: Record<ListRoute, MessageKey> = {
  shopping: "list.shopping",
  books: "list.books",
  movies: "list.movies",
  recipes: "list.recipes",
};

const MUSIC_ROUTE_HREF: Record<MusicRoute, string> = {
  musicArtists: "/music/artists",
  musicTracks: "/music/tracks",
};

const MUSIC_ROUTE_TITLE_KEY: Record<MusicRoute, MessageKey> = {
  musicArtists: "list.musicArtists",
  musicTracks: "list.musicTracks",
};

const MUSIC_ROUTE_TYPE: Record<MusicRoute, ItemType> = {
  musicArtists: "music_artist",
  musicTracks: "music_track",
};

const RECENT_LIMIT = 20;

export default function HomePage() {
  const [counts, setCounts] = useState<Record<ItemType, number> | null>(null);
  const [recent, setRecent] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void getItemUseCases().then(async (useCases) => {
      const refresh = async () => {
        const [nextCounts, nextRecent] = await Promise.all([
          useCases.counts(),
          useCases.recent(RECENT_LIMIT),
        ]);
        if (!cancelled) {
          setCounts(nextCounts);
          setRecent(nextRecent);
        }
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
  }, []);

  const total =
    counts === null
      ? null
      : counts.shopping +
        counts.book +
        counts.movie +
        counts.recipe +
        counts.music_artist +
        counts.music_track;
  const showEmpty = total === 0;

  return (
    <main className="p-4 pb-20">
      <Link
        href="/search"
        className="mb-4 block rounded-lg border border-black/10 px-3 py-2 opacity-70 dark:border-white/10"
      >
        {t("search.placeholder")}
      </Link>
      {showEmpty ? <p className="mb-4 text-sm opacity-80">{t("home.empty")}</p> : null}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {LIST_ROUTES.map((route) => {
          const type = ROUTE_TO_TYPE[route];
          const label = t(ROUTE_TITLE_KEY[route]);
          const count = counts?.[type] ?? 0;
          return (
            <section
              key={route}
              aria-label={label}
              className="rounded-lg border border-black/10 p-3 dark:border-white/10"
            >
              <Link href={`/lists/${route}`} className="block">
                <h2 className="font-semibold">{label}</h2>
                <p className="mt-1 text-2xl tabular-nums">{count}</p>
              </Link>
            </section>
          );
        })}
        {MUSIC_ROUTES.map((route) => {
          const type = MUSIC_ROUTE_TYPE[route];
          const label = t(MUSIC_ROUTE_TITLE_KEY[route]);
          const count = counts?.[type] ?? 0;
          return (
            <section
              key={route}
              aria-label={label}
              className="rounded-lg border border-black/10 p-3 dark:border-white/10"
            >
              <Link href={MUSIC_ROUTE_HREF[route]} className="block">
                <h2 className="font-semibold">{label}</h2>
                <p className="mt-1 text-2xl tabular-nums">{count}</p>
              </Link>
            </section>
          );
        })}
      </div>
      {recent.length > 0 ? (
        <section aria-label={t("home.recent")}>
          <h2 className="mb-2 text-lg font-semibold">{t("home.recent")}</h2>
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
              <li key={item.id}>
                <Link href={`/items/${item.id}`} className="underline-offset-2 hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
