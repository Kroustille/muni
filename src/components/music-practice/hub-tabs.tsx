"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t } from "@/i18n";

const TABS = [
  { href: "/music-practice/compositions", labelKey: "musicPractice.tabs.compositions" as const },
  { href: "/music-practice/dj-sets", labelKey: "musicPractice.tabs.djSets" as const },
  { href: "/music-practice/apprentissage", labelKey: "musicPractice.tabs.apprentissage" as const },
];

export function MusicPracticeHubTabs() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 rounded-xl bg-muted/40 p-1"
      aria-label={t("musicPractice.nav")}
      data-testid="music-practice-tabs"
    >
      {TABS.map(({ href, labelKey }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
            data-testid={`music-practice-tab-${href.split("/").pop()}`}
          >
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
