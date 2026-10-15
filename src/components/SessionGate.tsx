"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSessionUseCases } from "@/composition/client";
import { t } from "@/i18n";

type GateState =
  | { phase: "loading" }
  | { phase: "ready"; reauthRequired: boolean };

export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void getSessionUseCases().then(async (session) => {
      const result = await session.open();
      if (cancelled) return;
      if (result.status === "sign-in-required") {
        router.replace("/sign-in");
        return;
      }
      setState({ phase: "ready", reauthRequired: result.reauthRequired });
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state.phase === "loading") {
    return null;
  }

  return (
    <>
      {state.reauthRequired ? (
        <div
          className="border-b border-black/10 bg-surface px-4 py-2 text-sm dark:border-white/10"
          role="status"
        >
          <p className="mx-auto flex max-w-xl flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t("session.reauthMessage")}</span>
            <Link href="/sign-in" className="font-medium underline">
              {t("session.reauthLink")}
            </Link>
          </p>
        </div>
      ) : null}
      {children}
    </>
  );
}
