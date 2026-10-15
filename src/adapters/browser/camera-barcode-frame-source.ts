import { isValidIsbn } from "@/domain/isbn";

import type { BarcodeFrameSource, BarcodeScanFrame } from "./barcode-scanner";

export type CameraBarcodeFrameSource = BarcodeFrameSource & {
  stopTracks(): void;
};

export type CameraBarcodeFrameSourceDeps = {
  video?: HTMLVideoElement;
  getUserMedia?: (
    constraints: MediaStreamConstraints,
  ) => Promise<MediaStream>;
};

function pickIsbn(rawValues: string[]): string | null {
  for (const raw of rawValues) {
    if (isValidIsbn(raw)) return raw;
  }
  return null;
}

async function scanCanvasWithWasm(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): Promise<string | null> {
  const imageData = context.getImageData(0, 0, width, height);
  const zbar = await import("@undecaf/zbar-wasm");
  const symbols = await zbar.scanImageData(imageData);
  const rawValues = symbols.map((symbol) => symbol.decode());
  return pickIsbn(rawValues);
}

export function createCameraBarcodeFrameSource(
  deps: CameraBarcodeFrameSourceDeps = {},
): CameraBarcodeFrameSource {
  const video = deps.video ?? document.createElement("video");
  video.setAttribute("playsinline", "true");
  video.muted = true;

  let stream: MediaStream | null = null;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  async function ensureStream(): Promise<void> {
    if (stream !== null) return;
    const getUserMedia =
      deps.getUserMedia ??
      navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    stream = await getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  }

  return {
    async *frames(): AsyncIterable<BarcodeScanFrame> {
      if (context === null) {
        throw new Error("Canvas 2D context unavailable");
      }
      await ensureStream();

      for (;;) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width === 0 || height === 0) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          continue;
        }
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        yield {
          detectWithNative: async (detector) => {
            const bitmap = await createImageBitmap(video);
            try {
              const results = await detector.detect(bitmap);
              return pickIsbn(results.map((entry) => entry.rawValue));
            } finally {
              bitmap.close();
            }
          },
          scanWithWasm: () => scanCanvasWithWasm(context, width, height),
        };

        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    },
    stopTracks() {
      for (const track of stream?.getTracks() ?? []) track.stop();
      stream = null;
      video.srcObject = null;
    },
  };
}
