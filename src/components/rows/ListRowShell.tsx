"use client";

import type { ReactNode } from "react";
import { LIST_TYPE_VISUAL } from "@/components/list-type-visual";
import type { ItemType } from "@/domain/item";

export type ListRowShellProps = {
  children: ReactNode;
  /** When set, shows the list-type accent stripe on the left. */
  itemType?: ItemType;
  selected?: boolean;
  /** Use `div` when nesting rows inside a grouped list item. */
  as?: "li" | "div";
};

export function ListRowShell({ children, itemType, selected, as = "li" }: ListRowShellProps) {
  const accent = itemType ? LIST_TYPE_VISUAL[itemType].accentColor : undefined;

  const className = `flex overflow-hidden rounded-xl border border-border bg-surface ${
    selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
  }`;

  const inner = (
    <>
      {accent ? (
        <div className="w-1 shrink-0 self-stretch" style={{ backgroundColor: accent }} aria-hidden />
      ) : null}
      <div className="min-w-0 flex-1 px-3 py-2">{children}</div>
    </>
  );

  if (as === "div") {
    return <div className={className}>{inner}</div>;
  }

  return <li className={className}>{inner}</li>;
}
