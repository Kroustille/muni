"use client";

import { useEffect, useState } from "react";

import type { StreamingProvider } from "@/domain/item";
import { t } from "@/i18n";

export type MovieStreamingSectionProps = {
  imdbId: string | null;
};

export function MovieStreamingSection({ imdbId }: MovieStreamingSectionProps) {
  const [providers, setProviders] = useState<StreamingProvider[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imdbId === null || imdbId.trim() === "") {
      setProviders([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetch(
      `/api/movies/streaming?imdbId=${encodeURIComponent(imdbId.trim())}`,
      { credentials: "include" },
    )
      .then(async (response) => {
        if (!response.ok) return { providers: [] as StreamingProvider[] };
        return (await response.json()) as { providers: StreamingProvider[] };
      })
      .then((body) => {
        if (!cancelled) setProviders(body.providers ?? []);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imdbId]);

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4" data-testid="streaming-section">
      <h2 className="text-base font-semibold">{t("movies.streaming.title")}</h2>
      {loading ? (
        <p className="text-sm text-muted">{t("action.loading")}</p>
      ) : providers === null ? null : providers.length === 0 ? (
        <p className="text-sm text-muted">{t("movies.streaming.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {providers.map((provider) => (
            <li key={provider.name}>
              {provider.url ? (
                <a href={provider.url} className="text-accent underline" target="_blank" rel="noreferrer">
                  {provider.name}
                </a>
              ) : (
                provider.name
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
