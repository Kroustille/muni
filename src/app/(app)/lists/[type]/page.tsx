"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getItemUseCases } from "@/composition/client";
import { ShoppingRow } from "@/components/rows/ShoppingRow";
import type { Item, ItemType } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

type ListRoute = "shopping" | "books" | "movies" | "recipes";

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

function isListRoute(value: string): value is ListRoute {
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

export default function ListPage() {
  const params = useParams();
  const routeParam = params.type;
  const route = typeof routeParam === "string" && isListRoute(routeParam) ? routeParam : null;
  const [items, setItems] = useState<Item[]>([]);

  if (route === null) {
    notFound();
  }

  const itemType = ROUTE_TO_TYPE[route];

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void getItemUseCases().then(async (useCases) => {
      const refresh = async () => {
        const next = await useCases.listItems(itemType);
        if (!cancelled) setItems(next);
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
  }, [itemType]);

  return (
    <main className="p-4 pb-20">
      <h1 className="mb-4 text-xl font-semibold">{t(ROUTE_TITLE_KEY[route])}</h1>
      {items.length === 0 ? (
        <p>{t("list.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            if (item.type === "shopping") {
              return (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onCheckedChange={(checked) => {
                    void getItemUseCases().then((useCases) =>
                      useCases.updateItem(item.id, { checked }),
                    );
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
