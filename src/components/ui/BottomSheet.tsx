"use client";

import { useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/components/use-is-mobile";
import { t } from "@/i18n";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelClass = isMobile
    ? "max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-border bg-background p-4 text-foreground"
    : "max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-4 text-foreground shadow-lg";

  return (
    <div
      className={`fixed inset-0 z-40 flex bg-black/50 ${isMobile ? "items-end" : "items-center justify-center p-4"}`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">{title}</h2>
          <button
            type="button"
            aria-label={t("action.close")}
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg text-muted"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
