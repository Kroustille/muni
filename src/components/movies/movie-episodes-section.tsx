"use client";

import {
  episodeKeysForDisplay,
  toggleEpisodeWatched,
} from "@/application/movies/episode-progress";
import type { Item } from "@/domain/item";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

export type MovieEpisodesSectionProps = {
  item: Item & { type: "movie"; mediaKind: "series" };
  onEpisodeChange: (updated: Item) => Promise<void>;
};

function todayIsoDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function MovieEpisodesSection({ item, onEpisodeChange }: MovieEpisodesSectionProps) {
  const keys = episodeKeysForDisplay(item.episodeProgress, item.nextEpisodeKey);
  const nextKey = item.nextEpisodeKey;

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("movies.episodes.title")}</h2>
      {nextKey ? (
        <p className="text-sm text-muted" data-testid="next-episode-banner">
          {t("movies.episodes.next")}: {nextKey}
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {keys.map((key) => {
          const watched = item.episodeProgress?.[key]?.watchedAt;
          return (
            <li key={key}>
              <Button
                type="button"
                variant={watched ? "secondary" : "primary"}
                className="w-full"
                onClick={() => {
                  const updated = toggleEpisodeWatched(item, key, todayIsoDate());
                  void onEpisodeChange(updated);
                }}
              >
                {key}
                {watched ? ` ✓` : ""}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
