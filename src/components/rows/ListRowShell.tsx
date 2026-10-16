"use client";

import type { ReactNode } from "react";
import { LIST_TYPE_VISUAL } from "@/components/list-type-visual";
import type { ItemType } from "@/domain/item";

export type ListRowShellProps = {
  children: ReactNode;
  /** When set, shows the list-type accent stripe on the left. */
  itemType?: ItemType;
  selected?: boolean;
};

export function ListRowShell({ children, itemType, selected }: ListRowShellProps) {
  const accent = itemType ? LIST_TYPE_VISUAL[itemType].accentColor : undefined;

  return (
    <li
      className={`flex overflow-hidden rounded-xl border border-border bg-surface ${
        selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
      }`}
    >
      {accent ? (
        <div className="w-1 shrink-0 self-stretch" style={{ backgroundColor: accent }} aria-hidden />
      ) : null}
      <div className="min-w-0 flex-1 px-3 py-2">{children}</div>
    </li>
  );
}
