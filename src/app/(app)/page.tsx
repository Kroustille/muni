"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { HomeFitnessCard } from "@/components/fitness/home-fitness-card";
import { RavenIllustration } from "@/components/illustrations/RavenIllustration";
import { LIST_TYPE_VISUAL } from "@/components/list-type-visual";
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

const TYPE_LABEL_KEY: Record<ItemType, MessageKey> = {
  shopping: "type.shopping",
  book: "type.book",
  movie: "type.movie",
  recipe: "type.recipe",
  music_artist: "type.music_artist",
  music_track: "type.music_track",
};

function HomeListCard({
  href,
  label,
  count,
  itemType,
}: {
  href: string;
  label: string;
  count: number;
  itemType: ItemType;
}) {
  const { accentColor, icon: Icon } = LIST_TYPE_VISUAL[itemType];

  return (
    <section
      aria-label={label}
      className="flex overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: accentColor }} aria-hidden />
      <Link href={href} className="flex flex-1 items-center gap-3 p-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}1a` }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-tight">{label}</h2>
          <p className="mt-0.5 text-2xl tabular-nums">{count}</p>
        </div>
      </Link>
    </section>
  );
}

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
    <main className="mx-auto w-full max-w-4xl p-4 pb-20 md:pb-4">
      <Link
        href="/search"
        className="mb-4 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-muted"
      >
        <Search className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span className="truncate">{t("search.placeholder")}</span>
      </Link>
      <div className="mb-4">
        <HomeFitnessCard />
      </div>
      {showEmpty ? (
        <div className="mb-6 flex flex-col items-center gap-2 py-4 text-center" role="status">
          <RavenIllustration className="h-12 w-12 text-muted" />
          <p className="text-sm text-foreground">{t("home.empty")}</p>
          <p className="text-sm text-muted">{t("home.empty.hint")}</p>
        </div>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {LIST_ROUTES.map((route) => {
          const type = ROUTE_TO_TYPE[route];
          const label = t(ROUTE_TITLE_KEY[route]);
          const count = counts?.[type] ?? 0;
          return (
            <HomeListCard
              key={route}
              href={`/lists/${route}`}
              label={label}
              count={count}
              itemType={type}
            />
          );
        })}
        {MUSIC_ROUTES.map((route) => {
          const type = MUSIC_ROUTE_TYPE[route];
          const label = t(MUSIC_ROUTE_TITLE_KEY[route]);
          const count = counts?.[type] ?? 0;
          return (
            <HomeListCard
              key={route}
              href={MUSIC_ROUTE_HREF[route]}
              label={label}
              count={count}
              itemType={type}
            />
          );
        })}
      </div>
      {recent.length > 0 ? (
        <section aria-label={t("home.recent")}>
          <h2 className="mb-2 text-lg">{t("home.recent")}</h2>
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-surface px-3 py-2"
              >
                <Link
                  href={`/items/${item.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-muted">{t(TYPE_LABEL_KEY[item.type])}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
