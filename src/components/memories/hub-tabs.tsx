"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t, type MessageKey } from "@/i18n";

export type HubTab = { href: string; labelKey: MessageKey; testId: string };

/** Path-based tabs for the Souvenirs and Progression hubs (015). */
export function HubTabs({ tabs, labelKey }: { tabs: readonly HubTab[]; labelKey: MessageKey }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-xl bg-muted/40 p-1" aria-label={t(labelKey)}>
      {tabs.map(({ href, labelKey: tabLabel, testId }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
            data-testid={testId}
          >
            {t(tabLabel)}
          </Link>
        );
      })}
    </nav>
  );
}

export const SOUVENIRS_TABS: readonly HubTab[] = [
  { href: "/souvenirs", labelKey: "memories.tab.timeline", testId: "memories-tab-timeline" },
  { href: "/souvenirs/liste", labelKey: "memories.tab.list", testId: "memories-tab-list" },
];

export const PROGRESSION_TABS: readonly HubTab[] = [
  { href: "/progression", labelKey: "progression.tab.goals", testId: "progression-tab-goals" },
  {
    href: "/progression/realisations",
    labelKey: "progression.tab.achievements",
    testId: "progression-tab-achievements",
  },
];
