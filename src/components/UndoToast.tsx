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
  deleteManyWithUndo: (itemIds: string[]) => Promise<void>;
  isPendingUndo: (itemId: string) => boolean;
};

const UndoDeleteContext = createContext<UndoDeleteContextValue | null>(null);

export function UndoDeleteProvider({ children }: { children: ReactNode }) {
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startPending = useCallback(
    (ids: string[]) => {
      clearTimer();
      setPendingIds(ids);
      timerRef.current = setTimeout(() => {
        setPendingIds(null);
        timerRef.current = undefined;
      }, UNDO_MS);
    },
    [clearTimer],
  );

  const deleteManyWithUndo = useCallback(
    async (itemIds: string[]) => {
      if (itemIds.length === 0) return;
      const useCases = await getItemUseCases();
      for (const id of itemIds) {
        await useCases.deleteItem(id);
      }
      startPending(itemIds);
    },
    [startPending],
  );

  const deleteWithUndo = useCallback(
    async (itemId: string) => {
      await deleteManyWithUndo([itemId]);
    },
    [deleteManyWithUndo],
  );

  const undo = useCallback(async () => {
    if (pendingIds === null || pendingIds.length === 0) return;
    clearTimer();
    const useCases = await getItemUseCases();
    for (const id of pendingIds) {
      await useCases.restoreItem(id);
    }
    setPendingIds(null);
  }, [clearTimer, pendingIds]);

  const value = useMemo(
    () => ({
      deleteWithUndo,
      deleteManyWithUndo,
      isPendingUndo: (itemId: string) => pendingIds?.includes(itemId) ?? false,
    }),
    [deleteManyWithUndo, deleteWithUndo, pendingIds],
  );

  const toastMessage =
    pendingIds !== null && pendingIds.length > 1
      ? t("item.deletedMany").replace("{count}", String(pendingIds.length))
      : t("item.deleted");

  return (
    <UndoDeleteContext.Provider value={value}>
      {children}
      {pendingIds !== null && pendingIds.length > 0 ? (
        <Toast
          message={toastMessage}
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
