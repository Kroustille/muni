"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { LIST_TYPE_VISUAL } from "@/components/list-type-visual";
import { FEATURE_NAV, LIST_NAV, PRIMARY_NAV } from "@/components/nav-config";
import { itemTypeFromPath } from "@/components/quick-add/item-type-from-path";
import { useQuickAdd } from "@/components/quick-add/quick-add-context";
import { t } from "@/i18n";

export function SidebarNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useQuickAdd();
  const presetType = itemTypeFromPath(pathname);

  return (
    <aside
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-surface md:flex"
      aria-label={t("nav.sidebar")}
    >
      <div className="p-4">
        <p className="font-serif text-lg font-semibold text-foreground">{t("app.name")}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-2 pb-4">
        <ul className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map(({ href, labelKey, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${
                    active ? "bg-background font-semibold text-accent" : "text-foreground hover:bg-background/80"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
                  {t(labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
        {FEATURE_NAV.length > 0 && (
          <ul className="flex flex-col gap-0.5 px-0">
            {FEATURE_NAV.map(({ href, labelKey, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm ${
                      active ? "bg-background font-medium text-accent" : "text-foreground hover:bg-background/80"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
                    <span className="truncate">{t(labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <p className="mb-1 px-3 text-xs font-medium tracking-wide text-muted uppercase">
            {t("nav.lists")}
          </p>
          <ul className="flex flex-col gap-0.5">
            {LIST_NAV.map(({ href, labelKey, itemType, match }) => {
              const active = match(pathname);
              const { accentColor, icon: Icon } = LIST_TYPE_VISUAL[itemType];
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm ${
                      active ? "bg-background font-medium" : "text-foreground hover:bg-background/80"
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${accentColor}1a` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: accentColor }} strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="truncate">{t(labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div className="border-t border-border p-3">
        <button
          type="button"
          data-testid="nav-quick-add"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground"
          onClick={() => openQuickAdd(presetType ?? undefined)}
        >
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
          {t("nav.quickAdd")}
        </button>
      </div>
    </aside>
  );
}
