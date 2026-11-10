"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useIsMobile } from "@/components/use-is-mobile";

export type ListRowTitleProps = {
  itemId: string;
  children: ReactNode;
  className?: string;
  onSelect?: (id: string) => void;
};

export function ListRowTitle({ itemId, children, className = "", onSelect }: ListRowTitleProps) {
  const isMobile = useIsMobile();
  const linkClass = `font-medium underline-offset-2 hover:underline ${className}`.trim();

  const selectInPanel = !isMobile && onSelect !== undefined;

  // Always a real link (keyboard, screen readers, Ctrl/middle-click open the full
  // page). On desktop split view a plain click opens the side panel instead.
  return (
    <Link
      href={`/items/${itemId}`}
      className={`cursor-pointer text-left ${linkClass}`}
      onClick={
        selectInPanel
          ? (event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0
              ) {
                return;
              }
              event.preventDefault();
              onSelect(itemId);
            }
          : undefined
      }
    >
      {children}
    </Link>
  );
}
