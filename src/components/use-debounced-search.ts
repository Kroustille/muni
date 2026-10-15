"use client";

import { useEffect, useRef } from "react";

/** Catalog and in-app search: run lookup after the user pauses typing. */
export const SEARCH_DEBOUNCE_MS = 1000;

/**
 * Invokes `onSearch` after `delayMs` with no `query` changes. No-op when disabled or query is blank.
 */
export function useDebouncedSearch(
  query: string,
  enabled: boolean,
  onSearch: () => void | Promise<void>,
  delayMs: number = SEARCH_DEBOUNCE_MS,
): void {
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (!enabled) return;
    if (query.trim() === "") return;

    const id = window.setTimeout(() => {
      void onSearchRef.current();
    }, delayMs);

    return () => window.clearTimeout(id);
  }, [query, enabled, delayMs]);
}
