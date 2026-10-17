"use client";

import { LIST_TYPE_VISUAL } from "@/components/list-type-visual";
import { RavenIllustration } from "@/components/illustrations/RavenIllustration";
import type { ItemType } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

const EMPTY_MESSAGE_KEY: Record<ItemType, MessageKey> = {
  shopping: "list.empty.shopping",
  book: "list.empty.book",
  movie: "list.empty.movie",
  recipe: "list.empty.recipe",
  music_artist: "list.empty.music_artist",
  music_track: "list.empty.music_track",
};

export type ListEmptyStateProps = {
  itemType: ItemType;
  showRaven?: boolean;
  /** Override default empty-list copy (e.g. no search matches). */
  messageKey?: MessageKey;
};

export function ListEmptyState({
  itemType,
  showRaven = true,
  messageKey,
}: ListEmptyStateProps) {
  const { accentColor, icon: Icon } = LIST_TYPE_VISUAL[itemType];

  return (
    <div
      className="flex flex-col items-center gap-4 py-12 text-center"
      role="status"
      aria-label={t(messageKey ?? EMPTY_MESSAGE_KEY[itemType])}
    >
      {showRaven ? <RavenIllustration className="h-14 w-14 text-muted" /> : null}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accentColor}1a` }}
      >
        <Icon className="h-6 w-6" style={{ color: accentColor }} strokeWidth={1.5} aria-hidden />
      </div>
      <p className="max-w-sm text-base text-foreground">{t(messageKey ?? EMPTY_MESSAGE_KEY[itemType])}</p>
      <p className="max-w-sm text-sm text-muted">{t("list.empty.hint")}</p>
    </div>
  );
}
