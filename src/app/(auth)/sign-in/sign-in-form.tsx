"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RemoteStoreError } from "@/application/ports/remote-store";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getAuthGateway } from "@/composition/client";
import { t } from "@/i18n";

export type SignInFormProps = {
  linkExpired: boolean;
  googleSignInEnabled: boolean;
};

export function SignInForm({ linkExpired, googleSignInEnabled }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (offline || submitting) return;
    setSubmitError(false);
    setSubmitting(true);
    try {
      await (await getAuthGateway()).startMagicLinkSignIn(email.trim());
      setLinkSent(true);
    } catch (error) {
      if (error instanceof RemoteStoreError && error.kind === "network") {
        setOffline(true);
      } else {
        setSubmitError(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-[1.35rem] text-foreground">{t("signIn.title")}</h1>

      {linkExpired ? (
        <p className="text-sm text-danger" role="status">{t("signIn.linkExpired")}</p>
      ) : null}

      {offline ? (
        <p className="text-sm text-muted" role="status">{t("signIn.offline")}</p>
      ) : null}

      {linkSent ? (
        <p className="text-sm text-foreground" role="status">{t("signIn.linkSent")}</p>
      ) : null}

      {submitError ? (
        <p className="text-sm text-danger" role="alert">{t("signIn.error")}</p>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          label={t("signIn.email")}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          disabled={offline || submitting}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" disabled={offline || submitting || email.trim() === ""}>
          {t("signIn.sendLink")}
        </Button>
      </form>

      {googleSignInEnabled ? (
        <Button
          type="button"
          variant="secondary"
          disabled={offline || submitting}
          onClick={() => void getAuthGateway().then((gateway) => gateway.startGoogleSignIn())}
        >
          {t("signIn.google")}
        </Button>
      ) : null}
    </div>
  );
}
