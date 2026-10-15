"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { itemTypeFromPath } from "@/components/quick-add/item-type-from-path";
import { useQuickAdd } from "@/components/quick-add/quick-add-context";
import { t } from "@/i18n";

const sideLinks = [
  { href: "/", label: t("nav.home"), match: (pathname: string) => pathname === "/" },
  {
    href: "/search",
    label: t("nav.search"),
    match: (pathname: string) => pathname === "/search" || pathname.startsWith("/search/"),
  },
  {
    href: "/settings",
    label: t("nav.settings"),
    match: (pathname: string) => pathname === "/settings" || pathname.startsWith("/settings/"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useQuickAdd();
  const presetType = itemTypeFromPath(pathname);

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white dark:border-white/10 dark:bg-black"
    >
      <ul className="mx-auto flex max-w-xl items-stretch">
        {sideLinks.slice(0, 2).map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 w-full items-center justify-center text-sm ${active ? "font-semibold" : "opacity-70"}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label={t("nav.quickAdd")}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-foreground text-2xl leading-none text-background shadow-md"
            onClick={() => openQuickAdd(presetType ?? undefined)}
          >
            +
          </button>
        </li>
        {sideLinks.slice(2).map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 w-full items-center justify-center text-sm ${active ? "font-semibold" : "opacity-70"}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
