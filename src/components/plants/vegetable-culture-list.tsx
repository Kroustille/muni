"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCultureUseCases, subscribeSyncStatus } from "@/composition/client";
import type { VegetableCulture } from "@/domain/vegetable-culture";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

export function VegetableCultureList() {
  const [cultures, setCultures] = useState<VegetableCulture[]>([]);
  const [quickAdd, setQuickAdd] = useState("");
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    const uc = await getCultureUseCases();
    setCultures(await uc.listCultures());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeSync: (() => void) | undefined;
    let previousSync: string | undefined;

    refreshRef.current = refresh;
    void refresh();

    void subscribeSyncStatus((state) => {
      if (previousSync !== undefined && previousSync !== "idle" && state === "idle") {
        void refreshRef.current?.();
      }
      previousSync = state;
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeSync = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribeSync?.();
      refreshRef.current = null;
    };
  }, [refresh]);

  const onQuickAdd = async (): Promise<void> => {
    const title = quickAdd.trim();
    if (title.length === 0) return;
    const uc = await getCultureUseCases();
    await uc.createCulture({ title });
    setQuickAdd("");
    await refresh();
  };

  return (
    <div className="space-y-4" data-testid="vegetable-culture-list">
      <Link href="/plants" className="text-sm text-accent">
        ← {t("plants.title")}
      </Link>
      <h1 className="font-serif text-2xl font-semibold">{t("plants.potager.title")}</h1>

      {cultures.length === 0 ? (
        <p className="py-8 text-center text-muted" data-testid="potager-list-empty">
          {t("plants.potager.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {cultures.map((culture) => (
            <li key={culture.id}>
              <Link
                href={`/plants/potager/${culture.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-3"
                data-testid={`potager-row-${culture.id}`}
              >
                <span className="font-medium">{culture.title}</span>
                {culture.locationNote ? (
                  <span className="text-sm text-muted">{culture.locationNote}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onQuickAdd();
        }}
        data-testid="potager-quick-add"
      >
        <input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder={t("plants.potager.quickAdd.placeholder")}
          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
          data-testid="potager-quick-add-input"
        />
        <Button type="submit" data-testid="potager-quick-add-submit">
          {t("plants.quickAdd.submit")}
        </Button>
      </form>
    </div>
  );
}
