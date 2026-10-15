"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { t } from "@/i18n";

const UNDO_MS = 5000;

type UndoDeleteContextValue = {
  deleteWithUndo: (itemId: string) => Promise<void>;
  isPendingUndo: (itemId: string) => boolean;
};

const UndoDeleteContext = createContext<UndoDeleteContextValue | null>(null);

export function UndoDeleteProvider({ children }: { children: ReactNode }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const deleteWithUndo = useCallback(
    async (itemId: string) => {
      clearTimer();
      const useCases = await getItemUseCases();
      await useCases.deleteItem(itemId);
      setPendingId(itemId);
      timerRef.current = setTimeout(() => {
        setPendingId(null);
        timerRef.current = undefined;
      }, UNDO_MS);
    },
    [clearTimer],
  );

  const undo = useCallback(async () => {
    if (pendingId === null) return;
    clearTimer();
    const useCases = await getItemUseCases();
    await useCases.restoreItem(pendingId);
    setPendingId(null);
  }, [clearTimer, pendingId]);

  const value = useMemo(
    () => ({
      deleteWithUndo,
      isPendingUndo: (itemId: string) => pendingId === itemId,
    }),
    [deleteWithUndo, pendingId],
  );

  return (
    <UndoDeleteContext.Provider value={value}>
      {children}
      {pendingId !== null ? (
        <Toast
          message={t("item.deleted")}
          action={
            <Button type="button" variant="secondary" onClick={() => void undo()}>
              {t("action.undo")}
            </Button>
          }
        />
      ) : null}
    </UndoDeleteContext.Provider>
  );
}

export function useUndoDelete(): UndoDeleteContextValue {
  const context = useContext(UndoDeleteContext);
  if (context === null) {
    throw new Error("useUndoDelete must be used within UndoDeleteProvider");
  }
  return context;
}

export type DeleteWithUndoButtonProps = {
  itemId: string;
  className?: string;
};

/** Delete control for list rows; shows the shared Undo toast. */
export function DeleteWithUndoButton({ itemId, className }: DeleteWithUndoButtonProps) {
  const { deleteWithUndo } = useUndoDelete();
  return (
    <Button
      type="button"
      variant="danger"
      className={className}
      onClick={() => void deleteWithUndo(itemId)}
    >
      {t("action.delete")}
    </Button>
  );
}
