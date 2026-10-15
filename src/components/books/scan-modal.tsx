"use client";

import { useEffect, useRef, useState } from "react";

import { createBookBarcodeScanner } from "@/composition/client";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";

export type ScanModalProps = {
  open: boolean;
  onClose: () => void;
  onIsbn: (isbn: string) => void;
};

export function ScanModal({ open, onClose, onIsbn }: ScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCameraError(null);
      return;
    }

    const video = videoRef.current;
    if (video === null) return;

    let cancelled = false;
    const { scanner, stopTracks } = createBookBarcodeScanner(video);

    void (async () => {
      try {
        await scanner.scanContinuous((isbn) => {
          if (cancelled) return;
          scanner.stop();
          stopTracks();
          onIsbn(isbn);
        });
      } catch {
        if (!cancelled) setCameraError(t("books.scan.cameraDenied"));
      }
    })();

    return () => {
      cancelled = true;
      scanner.stop();
      stopTracks();
    };
  }, [open, onIsbn]);

  return (
    <BottomSheet open={open} onClose={onClose} title={t("books.scan.title")}>
      <p className="mb-3 text-sm text-muted">{t("books.scan.hint")}</p>
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      </div>
      {cameraError ? <p className="mb-3 text-sm text-danger">{cameraError}</p> : null}
      <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
        {t("action.cancel")}
      </Button>
    </BottomSheet>
  );
}
