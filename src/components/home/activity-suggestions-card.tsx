"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, X } from "lucide-react";
import { t, type MessageKey } from "@/i18n";
import type { ActivitySuggestionSlot } from "@/domain/activity-suggestion";
import type { DailySuggestionsState } from "@/components/home/use-daily-suggestions";

const DOMAIN_LABEL: Record<string, MessageKey> = {
  book: "suggestions.domain.book",
  movie: "suggestions.domain.movie",
  music_track: "suggestions.domain.music_track",
  recipe: "suggestions.domain.recipe",
  fitness: "suggestions.domain.fitness",
  music_practice: "suggestions.domain.music_practice",
  plants: "suggestions.domain.plants",
};

function domainLabel(domainId: string): string {
  const key = DOMAIN_LABEL[domainId];
  return key ? t(key) : domainId;
}

function actionLabel(key: string): string {
  return t(key as MessageKey);
}

function SuggestionRow({
  slot,
  onDismiss,
  onNavigate,
}: {
  slot: ActivitySuggestionSlot;
  onDismiss: () => void;
  onNavigate: (href: string) => void;
}) {
  const { candidate } = slot;
  return (
    <li className="rounded-lg border border-border/80 bg-background/40 p-3">
      <p className="text-sm font-medium text-foreground">
        {candidate.title}{" "}
        <span className="font-normal text-muted">({domainLabel(candidate.domainId)})</span>
      </p>
      {candidate.subtitle ? (
        <p className="mt-0.5 text-xs text-muted">{candidate.subtitle}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-9 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground"
          onClick={() => onNavigate(candidate.deepLink)}
        >
          {actionLabel(candidate.primaryActionKey)}
        </button>
        <button
          type="button"
          className="min-h-9 rounded-lg border border-border px-3 text-sm text-muted"
          onClick={onDismiss}
        >
          {t("suggestions.action.dismiss")}
        </button>
      </div>
    </li>
  );
}

export function ActivitySuggestionsCard({
  state,
}: {
  state: DailySuggestionsState;
}) {
  const router = useRouter();
  const { viewModel, loading, refresh, dismissSlot, dismissBlock } = state;

  if (loading || viewModel === null || viewModel.hidden) {
    return null;
  }

  return (
    <section
      id="activity-suggestions"
      className="rounded-xl border border-border bg-surface p-4"
      aria-labelledby="activity-suggestions-title"
      data-testid="activity-suggestions-card"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 id="activity-suggestions-title" className="text-base font-semibold">
            {t("suggestions.title")}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t("suggestions.subtitle")}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted"
            aria-label={t("suggestions.action.refresh")}
            onClick={() => void refresh()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted"
            aria-label={t("suggestions.action.dismissBlock")}
            onClick={() => void dismissBlock()}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="mb-3 text-sm text-foreground">{t(viewModel.introKey)}</p>
      <ul className="flex flex-col gap-2">
        {viewModel.visibleSlots.map((slot) => (
          <SuggestionRow
            key={slot.slotId}
            slot={slot}
            onDismiss={() => void dismissSlot(slot.slotId)}
            onNavigate={(href) => router.push(href)}
          />
        ))}
      </ul>
      {viewModel.showPartialEmpty ? (
        <p className="mt-3 text-sm text-muted">{t("suggestions.partialEmpty")}</p>
      ) : null}
    </section>
  );
}

export function SuggestionsRecapTeaser({
  state,
}: {
  state: DailySuggestionsState;
}) {
  const { viewModel, loading } = state;
  if (loading || viewModel === null || viewModel.hidden || viewModel.visibleSlots.length === 0) {
    return null;
  }
  return (
    <p className="mb-4 text-sm" data-testid="suggestions-recap-teaser">
      <Link href="/#activity-suggestions" className="font-medium text-accent underline-offset-2 hover:underline">
        {t("suggestions.recapTeaser")}
      </Link>
    </p>
  );
}
