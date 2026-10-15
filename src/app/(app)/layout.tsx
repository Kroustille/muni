import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { QuickAddShell } from "@/components/QuickAddShell";
import { SessionGate } from "@/components/SessionGate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <div className="flex min-h-dvh flex-col">
        <div className="flex-1 pb-16">{children}</div>
        <QuickAddShell />
        <BottomNav />
      </div>
    </SessionGate>
  );
}
