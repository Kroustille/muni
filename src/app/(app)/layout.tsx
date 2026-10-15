import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
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
          <div className="flex min-h-dvh flex-col">
            <div className="flex-1 pb-16">{children}</div>
            <BottomNav />
          </div>
        </QuickAddProvider>
      </UndoDeleteShell>
    </SessionGate>
  );
}
