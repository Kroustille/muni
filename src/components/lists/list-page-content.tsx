"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getItemUseCases, subscribeSyncStatus } from "@/composition/client";
import { ListQuickAddButton } from "@/components/quick-add/list-quick-add-button";
import { BookCatalogFlow } from "@/components/books/book-catalog-flow";
import { BookTitleCatalogFlow } from "@/components/books/book-title-catalog-flow";
import { MovieCatalogFlow } from "@/components/movies/movie-catalog-flow";
import { BookMovieRow } from "@/components/rows/BookMovieRow";
import { ShoppingRow } from "@/components/rows/ShoppingRow";
import { ListSortFilter } from "@/components/ListSortFilter";
import { StatusFilter, type StatusFilterValue } from "@/components/StatusFilter";
import { itemTypeSupportsRatingSort, type ListSortMode } from "@/domain/list-sort";
import { useIsMobile } from "@/components/use-is-mobile";
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
};

export function ListPageContent({ route }: ListPageContentProps) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [listSort, setListSort] = useState<ListSortMode>("newest");
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const itemType = ROUTE_TO_TYPE[route];
  const showStatusFilter = itemType === "book" || itemType === "movie";
  const showRatingSort = itemTypeSupportsRatingSort(itemType);

  useEffect(() => {
    setStatusFilter("all");
    setListSort("newest");
  }, [itemType]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeItems: (() => void) | undefined;
    let unsubscribeSync: (() => void) | undefined;
    let previousSyncStatus: string | undefined;

    void getItemUseCases().then(async (useCases) => {
      const refresh = async () => {
        const listOptions: { status?: ItemStatus; sort?: ListSortMode } = {
          sort: showRatingSort ? listSort : "newest",
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
  }, [itemType, showStatusFilter, statusFilter, showRatingSort, listSort]);

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

  return (
    <main className="p-4 pb-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t(ROUTE_TITLE_KEY[route])}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ListQuickAddButton itemType={itemType} />
          {route === "books" && isMobile ? (
            <>
              <BookCatalogFlow onSaved={refreshList} showDefaultTrigger />
              <BookTitleCatalogFlow onSaved={refreshList} />
            </>
          ) : null}
          {route === "movies" ? <MovieCatalogFlow onSaved={refreshList} /> : null}
        </div>
      </div>
      {showStatusFilter ? (
        <StatusFilter
          itemType={itemType}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      ) : null}
      {showRatingSort ? <ListSortFilter value={listSort} onChange={setListSort} /> : null}
      {items.length === 0 ? (
        <p>{t("list.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            if (item.type === "shopping") {
              const shoppingItem = item as typeof item & { type: "shopping" };
              return (
                <ShoppingRow
                  key={item.id}
                  item={shoppingItem}
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
              <li key={item.id} className="rounded-lg border border-border px-3 py-2">
                <Link href={`/items/${item.id}`} className="font-medium underline-offset-2 hover:underline">
                  {item.title}
                </Link>
                {secondary ? <p className="text-sm text-muted">{secondary}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export function ListPageFromParam({ routeParam }: { routeParam: string | undefined }) {
  const route = typeof routeParam === "string" && isListRoute(routeParam) ? routeParam : null;
  if (route === null) notFound();
  return <ListPageContent route={route} />;
}
