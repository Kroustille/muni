import type { ReactNode } from "react";

import { t, type MessageKey } from "@/i18n";
import { HubTabs, type HubTab } from "./hub-tabs";

/** Shared shell for the 015 hubs: title, tabs, then content. */
export function HubPage({
  titleKey,
  tabs,
  children,
}: {
  titleKey: MessageKey;
  tabs: readonly HubTab[];
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 pb-20">
      <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
      <HubTabs tabs={tabs} labelKey={titleKey} />
      {children}
    </main>
  );
}

/** Calm, guilt-free empty state (009 tone). */
export function HubEmptyState({ messageKey, testId }: { messageKey: MessageKey; testId: string }) {
  return (
    <p role="status" className="py-12 text-center text-muted" data-testid={testId}>
      {t(messageKey)}
    </p>
  );
}
