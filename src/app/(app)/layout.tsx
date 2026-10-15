import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SyncStatus } from "@/components/SyncStatus";
import { QuickAddShell } from "@/components/QuickAddShell";
import { SessionGate } from "@/components/SessionGate";
import { UndoDeleteShell } from "@/components/UndoDeleteShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <SyncStatus />
      <UndoDeleteShell>
        <div className="flex min-h-dvh flex-col">
          <div className="flex-1 pb-16">{children}</div>
          <QuickAddShell />
          <BottomNav />
        </div>
      </UndoDeleteShell>
    </SessionGate>
  );
}
