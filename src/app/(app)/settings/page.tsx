"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getSessionUseCases } from "@/composition/client";
import { t } from "@/i18n";

export default function SettingsPage() {
  const router = useRouter();

  async function onSignOut() {
    const session = await getSessionUseCases();
    await session.signOut();
    router.replace("/sign-in");
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
      <Button type="button" variant="secondary" onClick={() => void onSignOut()}>
        {t("settings.signOut")}
      </Button>
    </main>
  );
}
