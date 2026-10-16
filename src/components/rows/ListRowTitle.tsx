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

  if (!isMobile && onSelect) {
    return (
      <button type="button" className={`cursor-pointer text-left ${linkClass}`} onClick={() => onSelect(itemId)}>
        {children}
      </button>
    );
  }

  return (
    <Link href={`/items/${itemId}`} className={`cursor-pointer ${linkClass}`}>
      {children}
    </Link>
  );
}
