"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/components/nav-config";
import { itemTypeFromPath } from "@/components/quick-add/item-type-from-path";
import { useQuickAdd } from "@/components/quick-add/quick-add-context";
import { t } from "@/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useQuickAdd();
  const presetType = itemTypeFromPath(pathname);

  const beforeFab = PRIMARY_NAV.slice(0, 2);
  const afterFab = PRIMARY_NAV.slice(2);

  return (
    <nav
      aria-label={t("nav.bottom")}
      className="fixed inset-x-0 bottom-0 border-t border-border bg-surface md:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch">
        {beforeFab.map(({ href, labelKey, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label={t("nav.quickAdd")}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg"
            onClick={() => openQuickAdd(presetType ?? undefined)}
          >
            <Plus className="h-7 w-7" strokeWidth={2} aria-hidden />
          </button>
        </li>
        {afterFab.map(({ href, labelKey, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
