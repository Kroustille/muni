"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getItemUseCases, subscribeSyncStatus } from "@/composition/client";
import { ItemDetailPanel } from "@/components/items/ItemDetailPanel";
import { ListEmptyState } from "@/components/lists/ListEmptyState";
import { ListSearchField } from "@/components/lists/ListSearchField";
import { ListSelectionBar } from "@/components/lists/ListSelectionBar";
import { useUndoDelete } from "@/components/UndoToast";
import { Button } from "@/components/ui/Button";
import { filterItemsForListLocalSearch } from "@/domain/list-local-search";
import { BookMovieRow } from "@/components/rows/BookMovieRow";
import { MusicArtistRow } from "@/components/rows/MusicArtistRow";
import { useIsMobile } from "@/components/use-is-mobile";
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
  const isMobile = useIsMobile();
  const itemType: ItemType = kind;
  const showStatusFilter = kind === "music_track";
  const allowRatingSortField = itemTypeSupportsRatingSort(kind);
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [listSort, setListSort] = useState<ListSort>(DEFAULT_LIST_SORT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const { deleteManyWithUndo } = useUndoDelete();
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const desktopSplit = !isMobile;

  useEffect(() => {
    setStatusFilter("all");
    setListSort(DEFAULT_LIST_SORT);
    setSelectedId(null);
    setSearchQuery("");
    setSelectionMode(false);
    setSelectedIds(new Set());
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

  const onSelectRow = desktopSplit && !selectionMode ? setSelectedId : undefined;

  const displayedItems = useMemo(
    () => filterItemsForListLocalSearch(items, searchQuery),
    [items, searchQuery],
  );

  const toggleBulkSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const rowSelectionProps = (id: string) => ({
    selectionMode,
    bulkSelected: selectedIds.has(id),
    onBulkToggle: () => toggleBulkSelected(id),
    showDelete: !selectionMode,
  });

  return (
    <main
      className={`mx-auto w-full p-4 pb-20 md:pb-4 ${desktopSplit ? "max-w-6xl" : "max-w-4xl"}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t(TITLE_KEY[kind])}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (selectionMode) exitSelectionMode();
              else setSelectionMode(true);
            }}
          >
            {selectionMode ? t("list.selection.done") : t("list.selection.toggle")}
          </Button>
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
      <div className="mb-4">
        <ListSearchField value={searchQuery} onChange={setSearchQuery} />
      </div>
      <div className={desktopSplit ? "grid gap-4 md:grid-cols-2 md:items-start" : undefined}>
        <div className="min-w-0">
          {items.length === 0 ? (
            <ListEmptyState itemType={itemType} />
          ) : displayedItems.length === 0 ? (
            <ListEmptyState itemType={itemType} messageKey="list.search.empty" showRaven={false} />
          ) : (
            <ul className="flex flex-col gap-2">
              {displayedItems.map((item) => {
                if (item.type === "music_track") {
                  const trackItem = item as Item & { type: "music_track" };
                  return (
                    <BookMovieRow
                      key={item.id}
                      item={trackItem}
                      selected={selectedId === item.id}
                      onSelect={onSelectRow}
                      {...rowSelectionProps(item.id)}
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
                    selected={selectedId === item.id}
                    onSelect={onSelectRow}
                    {...rowSelectionProps(item.id)}
                    onRatingChange={(rating) => updateArtistItem(item.id, { rating })}
                  />
                );
              })}
            </ul>
          )}
        </div>
        {desktopSplit && selectedId ? (
          <aside
            className="sticky top-4 min-h-[16rem] rounded-xl border border-border bg-surface"
            aria-label={t("item.detailPanel")}
          >
            <ItemDetailPanel
              itemId={selectedId}
              onUpdated={() => {
                void refreshRef.current?.();
              }}
            />
          </aside>
        ) : null}
      </div>
      <ListSelectionBar
        selectedCount={selectedIds.size}
        onClearSelection={exitSelectionMode}
        onBulkDelete={() => {
          const ids = [...selectedIds];
          void deleteManyWithUndo(ids).then(() => exitSelectionMode());
        }}
      />
    </main>
  );
}
