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
import { getFitnessSessionTemplateUseCases, getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { t } from "@/i18n";

const UNDO_MS = 5000;

type PendingUndo =
  | { kind: "items"; ids: string[] }
  | { kind: "fitness-template"; templateId: string; onRestored?: () => void };

type UndoDeleteContextValue = {
  deleteWithUndo: (itemId: string) => Promise<void>;
  deleteManyWithUndo: (itemIds: string[]) => Promise<void>;
  deleteFitnessTemplateWithUndo: (
    templateId: string,
    options?: { onRestored?: () => void },
  ) => Promise<void>;
  isPendingUndo: (itemId: string) => boolean;
};

const UndoDeleteContext = createContext<UndoDeleteContextValue | null>(null);

export function UndoDeleteProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingUndo | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startPending = useCallback(
    (next: PendingUndo) => {
      clearTimer();
      setPending(next);
      timerRef.current = setTimeout(() => {
        setPending(null);
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
      startPending({ kind: "items", ids: itemIds });
    },
    [startPending],
  );

  const deleteWithUndo = useCallback(
    async (itemId: string) => {
      await deleteManyWithUndo([itemId]);
    },
    [deleteManyWithUndo],
  );

  const deleteFitnessTemplateWithUndo = useCallback(
    async (templateId: string, options?: { onRestored?: () => void }) => {
      const useCases = await getFitnessSessionTemplateUseCases();
      await useCases.deleteTemplate(templateId);
      startPending({ kind: "fitness-template", templateId, onRestored: options?.onRestored });
    },
    [startPending],
  );

  const undo = useCallback(async () => {
    if (pending === null) return;
    clearTimer();
    if (pending.kind === "items") {
      const useCases = await getItemUseCases();
      for (const id of pending.ids) {
        await useCases.restoreItem(id);
      }
    } else {
      const useCases = await getFitnessSessionTemplateUseCases();
      await useCases.restoreTemplate(pending.templateId);
      pending.onRestored?.();
    }
    setPending(null);
  }, [clearTimer, pending]);

  const value = useMemo(
    () => ({
      deleteWithUndo,
      deleteManyWithUndo,
      deleteFitnessTemplateWithUndo,
      isPendingUndo: (itemId: string) =>
        pending?.kind === "items" ? (pending.ids.includes(itemId) ?? false) : false,
    }),
    [deleteFitnessTemplateWithUndo, deleteManyWithUndo, deleteWithUndo, pending],
  );

  const toastMessage =
    pending === null
      ? ""
      : pending.kind === "fitness-template"
        ? t("fitness.sessions.deleted")
        : pending.ids.length > 1
          ? t("item.deletedMany").replace("{count}", String(pending.ids.length))
          : t("item.deleted");

  return (
    <UndoDeleteContext.Provider value={value}>
      {children}
      {pending !== null ? (
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
