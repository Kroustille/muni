import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { QuickAddProvider } from "@/components/quick-add/quick-add-context";
import { SyncStatus } from "@/components/SyncStatus";
import { SessionGate } from "@/components/SessionGate";
import { UndoDeleteShell } from "@/components/UndoDeleteShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <SyncStatus />
      <UndoDeleteShell>
        <QuickAddProvider>
          <AppShell>{children}</AppShell>
        </QuickAddProvider>
      </UndoDeleteShell>
    </SessionGate>
  );
}
