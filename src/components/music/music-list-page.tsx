"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getItemUseCases, subscribeSyncStatus } from "@/composition/client";
import { BookMovieRow } from "@/components/rows/BookMovieRow";
import { MusicArtistRow } from "@/components/rows/MusicArtistRow";
import { ListSortFilter } from "@/components/ListSortFilter";
import { StatusFilter, type StatusFilterValue } from "@/components/StatusFilter";
import {
  DEFAULT_LIST_SORT,
  itemTypeSupportsRatingSort,
  normalizeListSort,
  type ListSort,
} from "@/domain/list-sort";
import {
  updateItem as applyItemPatch,
  type Item,
  type ItemPatch,
  type ItemStatus,
  type ItemType,
} from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

import { ListQuickAddButton } from "@/components/quick-add/list-quick-add-button";

import { MusicArtistCatalogFlow } from "./artist-catalog-flow";
import { MusicTrackCatalogFlow } from "./track-catalog-flow";

export type MusicListKind = "music_artist" | "music_track";

const TITLE_KEY: Record<MusicListKind, MessageKey> = {
  music_artist: "list.musicArtists",
  music_track: "list.musicTracks",
};

export type MusicListPageProps = {
  kind: MusicListKind;
};

export function MusicListPage({ kind }: MusicListPageProps) {
  const itemType: ItemType = kind;
  const showStatusFilter = kind === "music_track";
  const allowRatingSortField = itemTypeSupportsRatingSort(kind);
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [listSort, setListSort] = useState<ListSort>(DEFAULT_LIST_SORT);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    setStatusFilter("all");
    setListSort(DEFAULT_LIST_SORT);
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeItems: (() => void) | undefined;
    let unsubscribeSync: (() => void) | undefined;
    let previousSyncStatus: string | undefined;

    void getItemUseCases().then(async (useCases) => {
      const refresh = async () => {
        const listOptions: { status?: ItemStatus; sort?: ListSort } = {
          sort: normalizeListSort(listSort, allowRatingSortField),
        };
        if (showStatusFilter && statusFilter !== "all") {
          listOptions.status = statusFilter;
        }
        const next = await useCases.listItems(itemType, listOptions);
        if (!cancelled) setItems(next);
      };
      refreshRef.current = refresh;
      await refresh();
      unsubscribeItems = useCases.subscribe(() => {
        void refresh();
      });
    });

    void subscribeSyncStatus((state) => {
      if (previousSyncStatus !== undefined && previousSyncStatus !== "idle" && state === "idle") {
        void refreshRef.current?.();
      }
      previousSyncStatus = state;
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeSync = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribeItems?.();
      unsubscribeSync?.();
      refreshRef.current = null;
    };
  }, [itemType, showStatusFilter, statusFilter, allowRatingSortField, listSort]);

  const listOptionsForFilter = useCallback(() => {
    const options: { status?: ItemStatus; sort?: ListSort } = {
      sort: normalizeListSort(listSort, allowRatingSortField),
    };
    if (showStatusFilter && statusFilter !== "all") options.status = statusFilter;
    return options;
  }, [showStatusFilter, statusFilter, allowRatingSortField, listSort]);

  const revertList = useCallback(async () => {
    const useCases = await getItemUseCases();
    setItems(await useCases.listItems(itemType, listOptionsForFilter()));
  }, [itemType, listOptionsForFilter]);

  const updateArtistItem = useCallback(
    (id: string, patch: ItemPatch) => {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          try {
            return applyItemPatch(item, patch);
          } catch {
            return item;
          }
        }),
      );
      void getItemUseCases()
        .then((useCases) => useCases.updateItem(id, patch))
        .catch(() => revertList());
    },
    [revertList],
  );

  const updateTrackItem = useCallback(
    (id: string, patch: ItemPatch) => {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          try {
            return applyItemPatch(item, patch);
          } catch {
            return item;
          }
        }),
      );
      void getItemUseCases()
        .then((useCases) => useCases.updateItem(id, patch))
        .catch(() => revertList());
    },
    [revertList],
  );

  const refreshList = useCallback(() => {
    void refreshRef.current?.();
  }, []);

  return (
    <main className="p-4 pb-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t(TITLE_KEY[kind])}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ListQuickAddButton itemType={kind} />
          {kind === "music_artist" ? (
            <MusicArtistCatalogFlow onSaved={refreshList} />
          ) : (
            <MusicTrackCatalogFlow onSaved={refreshList} />
          )}
        </div>
      </div>
      {showStatusFilter ? (
        <StatusFilter itemType="music_track" value={statusFilter} onChange={setStatusFilter} />
      ) : null}
      <ListSortFilter
        value={listSort}
        onChange={setListSort}
        allowRatingField={allowRatingSortField}
      />
      {items.length === 0 ? (
        <p>{t("list.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            if (item.type === "music_track") {
              const trackItem = item as Item & { type: "music_track" };
              return (
                <BookMovieRow
                  key={item.id}
                  item={trackItem}
                  onStatusChange={(status) => updateTrackItem(item.id, { status })}
                  onRatingChange={(rating) => updateTrackItem(item.id, { rating })}
                />
              );
            }
            const artistItem = item as Item & { type: "music_artist" };
            return (
              <MusicArtistRow
                key={item.id}
                item={artistItem}
                onRatingChange={(rating) => updateArtistItem(item.id, { rating })}
              />
            );
          })}
        </ul>
      )}
    </main>
  );
}
