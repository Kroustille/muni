"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
