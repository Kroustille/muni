"use client";

import { notFound } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getItemUseCases, subscribeSyncStatus } from "@/composition/client";
import { ListQuickAddButton } from "@/components/quick-add/list-quick-add-button";
import { BookCatalogFlow } from "@/components/books/book-catalog-flow";
import { BookTitleCatalogFlow } from "@/components/books/book-title-catalog-flow";
import { MovieCatalogFlow } from "@/components/movies/movie-catalog-flow";
import { ItemDetailPanel } from "@/components/items/ItemDetailPanel";
import { BulkSagaSheet } from "@/components/lists/bulk-saga-sheet";
import { BulkSeriesSheet } from "@/components/lists/bulk-series-sheet";
import { ListEmptyState } from "@/components/lists/ListEmptyState";
import { ListSearchField } from "@/components/lists/ListSearchField";
import { ListSelectionBar } from "@/components/lists/ListSelectionBar";
import { useUndoDelete } from "@/components/UndoToast";
import { Button } from "@/components/ui/Button";
import { assignBooksToSeries } from "@/application/books/assign-series-bulk";
import { assignMoviesToFranchise } from "@/application/movies/assign-franchise-bulk";
import { filterItemsForListLocalSearch } from "@/domain/list-local-search";
import { ListRowShell } from "@/components/rows/ListRowShell";
import { ListRowTitle } from "@/components/rows/ListRowTitle";
import { BookMovieRow } from "@/components/rows/BookMovieRow";
import { ShoppingRow } from "@/components/rows/ShoppingRow";
import { ListSortFilter } from "@/components/ListSortFilter";
import { StatusFilter, type StatusFilterValue } from "@/components/StatusFilter";
import {
  DEFAULT_LIST_SORT,
  itemTypeSupportsRatingSort,
  normalizeListSort,
  type ListSort,
} from "@/domain/list-sort";
import {
  collectLibrarySeriesNames,
  collectLibraryTags,
  filterBooksByTagOrSeries,
  type BookTagSeriesFilter,
} from "@/application/books/book-library-filters";
import {
  collectLibraryFranchiseNames,
  collectLibraryTags as collectMovieLibraryTags,
  filterMoviesByTagOrFranchise,
  type MovieTagFranchiseFilter,
} from "@/application/movies/movie-library-filters";
import { BookDiscoverySheet } from "@/components/books/book-discovery-sheet";
import { BookRecommendations } from "@/components/books/book-recommendations";
import { BookTagSeriesFilters } from "@/components/books/book-tag-series-filters";
import { MovieTagFranchiseFilters } from "@/components/movies/movie-tag-franchise-filters";
import { MovieDiscoverySheet } from "@/components/movies/movie-discovery-sheet";
import { MovieRecommendations } from "@/components/movies/movie-recommendations";
import {
  filterBooksByDiscovery,
  type BookDiscoveryFilter,
} from "@/application/books/discovery-filters";
import {
  filterMoviesByDiscovery,
  type MovieDiscoveryFilter,
} from "@/application/movies/discovery-filters";
import { useIsMobile } from "@/components/use-is-mobile";
import { groupBooksByWork, type BookWorkGroup } from "@/application/books/work-grouping";
import type { Item, ItemPatch, ItemStatus, ItemType } from "@/domain/item";
import { updateItem as applyItemPatch } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

export type ListRoute = "shopping" | "books" | "movies" | "recipes";

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

export function isListRoute(value: string): value is ListRoute {
  return value in ROUTE_TO_TYPE;
}

function rowSecondaryText(item: Item): string | null {
  switch (item.type) {
    case "shopping":
      return item.quantity;
    case "book":
      return item.author;
    case "movie":
      return item.recommendedBy;
    case "recipe":
      return item.notes;
    default:
      return null;
  }
}

export type ListPageContentProps = {
  route: ListRoute;
  /** When true (books list), visually group editions that share a work id. */
  groupBooksByWork?: boolean;
  /** Enables tag/series filters and discovery UI on the books list. */
  bookLibraryUi?: boolean;
  movieLibraryUi?: boolean;
};

function editionGroupLabel(count: number): string {
  return t("books.editions.count").replace("{count}", String(count));
}

type BookListEntry =
  | { kind: "single"; item: Item }
  | { kind: "group"; group: BookWorkGroup };

function bookListEntries(items: Item[]): BookListEntry[] {
  return groupBooksByWork(items).map((group) =>
    group.items.length === 1
      ? { kind: "single", item: group.items[0]! }
      : { kind: "group", group },
  );
}

export function ListPageContent({
  route,
  groupBooksByWork: groupBooksByWorkEnabled = false,
  bookLibraryUi = false,
  movieLibraryUi = false,
}: ListPageContentProps) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [listSort, setListSort] = useState<ListSort>(DEFAULT_LIST_SORT);
  const [tagSeriesFilter, setTagSeriesFilter] = useState<BookTagSeriesFilter>({});
  const [discoveryFilter, setDiscoveryFilter] = useState<BookDiscoveryFilter>({});
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState<Item[]>([]);
  const [tagFranchiseFilter, setTagFranchiseFilter] = useState<MovieTagFranchiseFilter>({});
  const [movieDiscoveryFilter, setMovieDiscoveryFilter] = useState<MovieDiscoveryFilter>({});
  const [movieDiscoveryOpen, setMovieDiscoveryOpen] = useState(false);
  const [libraryMovies, setLibraryMovies] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkSeriesOpen, setBulkSeriesOpen] = useState(false);
  const [bulkSagaOpen, setBulkSagaOpen] = useState(false);
  const { deleteManyWithUndo } = useUndoDelete();
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const desktopSplit = !isMobile;

  const itemType = ROUTE_TO_TYPE[route];
  const showStatusFilter = itemType === "book" || itemType === "movie";
  const allowRatingSortField = itemTypeSupportsRatingSort(itemType);

  useEffect(() => {
    setStatusFilter("all");
    setListSort(DEFAULT_LIST_SORT);
    setTagSeriesFilter({});
    setDiscoveryFilter({});
    setTagFranchiseFilter({});
    setMovieDiscoveryFilter({});
    setSelectedId(null);
    setSearchQuery("");
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [itemType]);

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
        if (!cancelled) {
          if (bookLibraryUi && itemType === "book") {
            setLibraryBooks(next);
            setItems(
              filterBooksByDiscovery(
                filterBooksByTagOrSeries(next, tagSeriesFilter),
                discoveryFilter,
              ),
            );
          } else if (movieLibraryUi && itemType === "movie") {
            setLibraryMovies(next);
            setItems(
              filterMoviesByDiscovery(
                filterMoviesByTagOrFranchise(next, tagFranchiseFilter),
                movieDiscoveryFilter,
              ),
            );
          } else {
            setItems(next);
          }
        }
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
  }, [
    itemType,
    showStatusFilter,
    statusFilter,
    allowRatingSortField,
    listSort,
    bookLibraryUi,
    movieLibraryUi,
    tagSeriesFilter,
    discoveryFilter,
    tagFranchiseFilter,
    movieDiscoveryFilter,
  ]);

  useEffect(() => {
    if (!bookLibraryUi || itemType !== "book") return;
    setItems(
      filterBooksByDiscovery(
        filterBooksByTagOrSeries(libraryBooks, tagSeriesFilter),
        discoveryFilter,
      ),
    );
  }, [bookLibraryUi, itemType, libraryBooks, tagSeriesFilter, discoveryFilter]);

  useEffect(() => {
    if (!movieLibraryUi || itemType !== "movie") return;
    setItems(
      filterMoviesByDiscovery(
        filterMoviesByTagOrFranchise(libraryMovies, tagFranchiseFilter),
        movieDiscoveryFilter,
      ),
    );
  }, [movieLibraryUi, itemType, libraryMovies, tagFranchiseFilter, movieDiscoveryFilter]);

  const listOptionsForFilter = useCallback(
    () => (showStatusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
    [showStatusFilter, statusFilter],
  );

  const revertList = useCallback(async () => {
    const useCases = await getItemUseCases();
    const next = await useCases.listItems(itemType, listOptionsForFilter());
    setItems(next);
  }, [itemType, listOptionsForFilter]);

  const updateBookMovieItem = useCallback(
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
        <h1 className="text-[1.35rem]">{t(ROUTE_TITLE_KEY[route])}</h1>
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
          <ListQuickAddButton itemType={itemType} />
          {route === "books" ? (
            <>
              {isMobile ? (
                <BookCatalogFlow onSaved={refreshList} showDefaultTrigger />
              ) : null}
              <BookTitleCatalogFlow onSaved={refreshList} />
              {bookLibraryUi ? (
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-border px-3 text-sm"
                  onClick={() => setDiscoveryOpen(true)}
                >
                  {t("books.discovery.filters")}
                </button>
              ) : null}
            </>
          ) : null}
          {route === "movies" ? (
            <>
              <MovieCatalogFlow onSaved={refreshList} />
              {movieLibraryUi ? (
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-border px-3 text-sm"
                  onClick={() => setMovieDiscoveryOpen(true)}
                >
                  {t("movies.discovery.filters")}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {showStatusFilter ? (
        <StatusFilter
          itemType={itemType}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      ) : null}
      {bookLibraryUi && route === "books" ? (
        <BookTagSeriesFilters
          value={tagSeriesFilter}
          onChange={setTagSeriesFilter}
          tags={collectLibraryTags(libraryBooks)}
          seriesNames={collectLibrarySeriesNames(libraryBooks)}
        />
      ) : null}
      {bookLibraryUi && route === "books" ? (
        <BookDiscoverySheet
          open={discoveryOpen}
          onClose={() => setDiscoveryOpen(false)}
          value={discoveryFilter}
          onChange={setDiscoveryFilter}
          libraryBooks={libraryBooks}
        />
      ) : null}
      <ListSortFilter
        value={listSort}
        onChange={setListSort}
        allowRatingField={allowRatingSortField}
      />
      <div className="mb-4">
        <ListSearchField value={searchQuery} onChange={setSearchQuery} />
      </div>
      {bookLibraryUi && route === "books" ? (
        <BookRecommendations libraryBooks={libraryBooks} onSelect={setSelectedId} />
      ) : null}
      {movieLibraryUi && route === "movies" ? (
        <MovieTagFranchiseFilters
          value={tagFranchiseFilter}
          onChange={setTagFranchiseFilter}
          tags={collectMovieLibraryTags(libraryMovies)}
          franchiseNames={collectLibraryFranchiseNames(libraryMovies)}
        />
      ) : null}
      {movieLibraryUi && route === "movies" ? (
        <MovieDiscoverySheet
          open={movieDiscoveryOpen}
          onClose={() => setMovieDiscoveryOpen(false)}
          value={movieDiscoveryFilter}
          onChange={setMovieDiscoveryFilter}
          libraryMovies={libraryMovies}
        />
      ) : null}
      {movieLibraryUi && route === "movies" ? (
        <MovieRecommendations libraryMovies={libraryMovies} onSelect={setSelectedId} />
      ) : null}
      <div className={desktopSplit ? "grid gap-4 md:grid-cols-2 md:items-start" : undefined}>
        <div className="min-w-0">
          {items.length === 0 ? (
            <ListEmptyState itemType={itemType} />
          ) : displayedItems.length === 0 ? (
            <ListEmptyState itemType={itemType} messageKey="list.search.empty" showRaven={false} />
          ) : (
            <ul className="flex flex-col gap-2">
              {(groupBooksByWorkEnabled && route === "books"
                ? bookListEntries(displayedItems)
                : displayedItems.map((item) => ({ kind: "single" as const, item }))
              ).map((entry: BookListEntry) => {
                if (entry.kind === "group") {
                  const { group } = entry;
                  return (
                    <li
                      key={group.groupKey}
                      className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-surface/40 p-2"
                    >
                      <p className="px-1 text-xs font-medium text-muted">
                        {editionGroupLabel(group.items.length)}
                      </p>
                      {group.items.map((book) => (
                        <BookMovieRow
                          key={book.id}
                          item={book}
                          shellAs="div"
                          selected={selectedId === book.id}
                          onSelect={onSelectRow}
                          {...rowSelectionProps(book.id)}
                          onStatusChange={(status) => {
                            updateBookMovieItem(book.id, { status });
                          }}
                          onRatingChange={(rating) => {
                            updateBookMovieItem(book.id, { rating });
                          }}
                        />
                      ))}
                    </li>
                  );
                }

                const item = entry.item;
                if (item.type === "shopping") {
                  const shoppingItem = item as typeof item & { type: "shopping" };
                  return (
                    <ShoppingRow
                      key={item.id}
                      item={shoppingItem}
                      selected={selectedId === item.id}
                      onSelect={onSelectRow}
                      {...rowSelectionProps(item.id)}
                      onCheckedChange={(checked) => {
                        void getItemUseCases().then((useCases) =>
                          useCases.updateItem(item.id, { checked }),
                        );
                      }}
                    />
                  );
                }
                if (item.type === "book" || item.type === "movie") {
                  const mediaItem = item as typeof item & { type: "book" | "movie" };
                  return (
                    <BookMovieRow
                      key={item.id}
                      item={mediaItem}
                      selected={selectedId === item.id}
                      onSelect={onSelectRow}
                      {...rowSelectionProps(item.id)}
                      onStatusChange={(status) => {
                        updateBookMovieItem(item.id, { status });
                      }}
                      onRatingChange={(rating) => {
                        updateBookMovieItem(item.id, { rating });
                      }}
                    />
                  );
                }
                const secondary = rowSecondaryText(item);
                return (
                  <ListRowShell
                    key={item.id}
                    itemType={item.type}
                    selected={selectedId === item.id || selectedIds.has(item.id)}
                  >
                    <div className="flex items-start gap-2">
                      {selectionMode ? (
                        <input
                          type="checkbox"
                          className="mt-1 size-5 shrink-0 cursor-pointer accent-primary"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleBulkSelected(item.id)}
                          aria-label={item.title}
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <ListRowTitle itemId={item.id} onSelect={onSelectRow}>
                          {item.title}
                        </ListRowTitle>
                        {secondary ? <p className="text-sm text-muted">{secondary}</p> : null}
                      </div>
                      {!selectionMode ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="shrink-0"
                          onClick={() => void deleteManyWithUndo([item.id])}
                        >
                          {t("action.delete")}
                        </Button>
                      ) : null}
                    </div>
                  </ListRowShell>
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
        extraActions={
          <>
            {route === "books" ? (
              <Button type="button" variant="secondary" onClick={() => setBulkSeriesOpen(true)}>
                {t("list.selection.assignSeries")}
              </Button>
            ) : null}
            {route === "movies" ? (
              <Button type="button" variant="secondary" onClick={() => setBulkSagaOpen(true)}>
                {t("list.selection.assignSaga")}
              </Button>
            ) : null}
          </>
        }
      />
      {route === "books" ? (
        <BulkSeriesSheet
          open={bulkSeriesOpen}
          onClose={() => setBulkSeriesOpen(false)}
          seriesSuggestions={collectLibrarySeriesNames(libraryBooks.length ? libraryBooks : items)}
          onConfirm={async (seriesName, seriesPosition) => {
            const ids = [...selectedIds];
            const { patches } = assignBooksToSeries({
              books: items,
              ids,
              seriesName,
              seriesPosition,
            });
            const useCases = await getItemUseCases();
            for (const patch of patches) {
              await useCases.updateItem(patch.id, {
                seriesName: patch.seriesName,
                seriesPosition: patch.seriesPosition,
              });
            }
            exitSelectionMode();
            refreshList();
          }}
        />
      ) : null}
      {route === "movies" ? (
        <BulkSagaSheet
          open={bulkSagaOpen}
          onClose={() => setBulkSagaOpen(false)}
          franchiseSuggestions={collectLibraryFranchiseNames(
            libraryMovies.length ? libraryMovies : items,
          )}
          onConfirm={async (franchiseName, franchiseOrder) => {
            const ids = [...selectedIds];
            const { patches } = assignMoviesToFranchise({
              movies: items,
              ids,
              franchiseName,
              franchiseOrder,
            });
            const useCases = await getItemUseCases();
            for (const patch of patches) {
              await useCases.updateItem(patch.id, {
                franchiseName: patch.franchiseName,
                franchiseOrder: patch.franchiseOrder,
                franchiseId: patch.franchiseId,
              });
            }
            exitSelectionMode();
            refreshList();
          }}
        />
      ) : null}
    </main>
  );
}

export function ListPageFromParam({ routeParam }: { routeParam: string | undefined }) {
  const route = typeof routeParam === "string" && isListRoute(routeParam) ? routeParam : null;
  if (route === null) notFound();
  return <ListPageContent route={route} />;
}
