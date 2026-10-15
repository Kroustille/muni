import type { ReactNode } from "react";

export type ToastProps = {
  message: string;
  action?: ReactNode;
};

export function Toast({ message, action }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-foreground shadow-lg"
    >
      <span>{message}</span>
      {action}
    </div>
  );
}
