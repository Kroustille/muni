"use client";

import { useEffect, useState } from "react";
import { subscribeSyncStatus, type SyncStatusState } from "@/composition/client";
import { t } from "@/i18n";

function messageFor(state: SyncStatusState): string | null {
  switch (state) {
    case "syncing":
      return t("sync.syncing");
    case "offline":
      return t("sync.offline");
    case "paused":
      return t("sync.paused");
    default:
      return null;
  }
}

export function SyncStatus() {
  const [state, setState] = useState<SyncStatusState>("idle");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void subscribeSyncStatus((next) => setState(next)).then((off) => {
      unsubscribe = off;
    });
    return () => unsubscribe?.();
  }, []);

  const message = messageFor(state);
  if (message === null) return null;

  return (
    <p
      className="pointer-events-none fixed top-2 right-2 z-50 rounded-full border border-border bg-surface/95 px-3 py-1 text-xs text-muted shadow-sm backdrop-blur-sm md:left-60 md:right-auto"
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
