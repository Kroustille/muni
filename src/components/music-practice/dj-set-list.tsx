"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getDjSetUseCases } from "@/composition/client";
import type { DjSet, DjSetStatus } from "@/domain/dj-set";
import { normalizeText } from "@/domain/text";
import { djSetStatusLabel } from "@/components/music-practice/status-labels";
import { t } from "@/i18n";

const FILTER_STATUSES: DjSetStatus[] = ["planned", "performed"];

function statusLabel(status: DjSetStatus): string {
  return djSetStatusLabel(status);
}

export function DjSetList() {
  const [rows, setRows] = useState<DjSet[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<DjSetStatus>>(new Set());
  const [showCancelled, setShowCancelled] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [title, setTitle] = useState("");

  const refresh = async () => {
    const uc = await getDjSetUseCases();
    setRows(await uc.listDjSets());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const visible = useMemo(() => {
    const q = normalizeText(search.trim());
    return rows
      .filter((row) => (showDeleted ? true : row.deletedAt === null))
      .filter((row) => (showCancelled ? true : row.status !== "cancelled"))
      .filter((row) => {
        if (statusFilter.size === 0) return true;
        return statusFilter.has(row.status);
      })
      .filter((row) => q === "" || normalizeText(row.title).includes(q))
      .sort((a, b) => b.fieldsUpdatedAt.title.localeCompare(a.fieldsUpdatedAt.title));
  }, [rows, search, statusFilter, showCancelled, showDeleted]);

  const quickAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const uc = await getDjSetUseCases();
    await uc.createDjSet({ title: trimmed });
    setTitle("");
    await refresh();
  };

  return (
    <div className="space-y-4" data-testid="dj-set-list">
      <form
        className="flex flex-col gap-2 rounded-xl border border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void quickAdd();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("musicPractice.quickAdd.title")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="dj-set-quick-add-title"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground"
          data-testid="dj-set-quick-add-submit"
        >
          {t("action.add")}
        </button>
      </form>

      <input
        type="search"
        placeholder={t("musicPractice.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="dj-set-search"
      />

      <div className="flex flex-wrap gap-2">
        {FILTER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full px-3 py-1 text-xs ${statusFilter.has(status) ? "bg-accent text-accent-foreground" : "bg-muted/50"}`}
            onClick={() =>
              setStatusFilter((prev) => {
                const next = new Set(prev);
                if (next.has(status)) next.delete(status);
                else next.add(status);
                return next;
              })
            }
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={(e) => setShowCancelled(e.target.checked)}
          data-testid="dj-set-show-cancelled"
        />
        {t("musicPractice.filter.showCancelled")}
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
        {t("musicPractice.showDeleted")}
      </label>

      {visible.length === 0 ? (
        <p className="text-sm text-muted" data-testid="dj-set-empty">
          {t("musicPractice.empty.djSets")}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => (
            <li key={row.id}>
              <Link
                href={`/music-practice/dj-sets/${row.id}`}
                className="block rounded-xl border border-border px-3 py-2"
                data-testid={`dj-set-row-${row.id}`}
              >
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-muted">
                  {statusLabel(row.status)}
                  {row.performedAt ? ` · ${row.performedAt}` : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
