"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/i18n";

const links = [
  { href: "/", label: t("nav.home") },
  { href: "/search", label: t("nav.search") },
  { href: "/settings", label: t("nav.settings") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white dark:border-white/10 dark:bg-black"
    >
      <ul className="mx-auto flex max-w-xl">
        {links.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center justify-center text-sm ${active ? "font-semibold" : "opacity-70"}`}
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
