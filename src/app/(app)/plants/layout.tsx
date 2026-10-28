import type { ReactNode } from "react";

export default function PlantsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg p-4" data-testid="plants-shell">
      {children}
    </div>
  );
}
