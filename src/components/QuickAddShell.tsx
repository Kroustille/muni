"use client";

import { usePathname } from "next/navigation";
import { QuickAdd } from "@/components/QuickAdd";

function showQuickAdd(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/search" || pathname.startsWith("/search/")) return true;
  if (pathname.startsWith("/lists/")) return true;
  return false;
}

export function QuickAddShell() {
  const pathname = usePathname();
  if (!showQuickAdd(pathname)) return null;
  return <QuickAdd />;
}
