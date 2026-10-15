"use client";

import type { ReactNode } from "react";
import { UndoDeleteProvider } from "@/components/UndoToast";

export function UndoDeleteShell({ children }: { children: ReactNode }) {
  return <UndoDeleteProvider>{children}</UndoDeleteProvider>;
}
