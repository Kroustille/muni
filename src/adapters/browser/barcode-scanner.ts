import type { BarcodeScanner } from "@/application/ports/barcode-scanner";

export type BarcodeDetectorLike = {
  detect(image: unknown): Promise<Array<{ rawValue: string }>>;
};

export type BarcodeScanFrame = {
  detectWithNative?(detector: BarcodeDetectorLike): Promise<string | null>;
  scanWithWasm(): Promise<string | null>;
};

export type BarcodeFrameSource = {
  frames(): AsyncIterable<BarcodeScanFrame>;
};

export type BrowserBarcodeScannerDeps = {
  frameSource: BarcodeFrameSource;
  /** When true and a detector is provided, try native detection before WASM. */
  useNativeDetector: boolean;
  barcodeDetector?: BarcodeDetectorLike;
};

export function createBrowserBarcodeScanner(deps: BrowserBarcodeScannerDeps): BarcodeScanner {
  let stopped = false;

  return {
    async scanContinuous(callback) {
      stopped = false;
      for await (const frame of deps.frameSource.frames()) {
        if (stopped) break;

        let isbn: string | null = null;
        if (deps.useNativeDetector && deps.barcodeDetector && frame.detectWithNative) {
          isbn = await frame.detectWithNative(deps.barcodeDetector);
        }
        if (isbn === null) {
          isbn = await frame.scanWithWasm();
        }
        if (isbn !== null) {
          callback(isbn);
          return;
        }
      }
    },
    stop() {
      stopped = true;
    },
  };
}

type BarcodeDetectorGlobal = {
  BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
};

export function isBarcodeDetectorAvailable(global: BarcodeDetectorGlobal): boolean {
  return typeof global.BarcodeDetector === "function";
}

/** Android Chrome when `BarcodeDetector` exists; otherwise WASM-only (iOS/PWA). */
export function createPlatformBrowserBarcodeScanner(
  deps: Omit<BrowserBarcodeScannerDeps, "useNativeDetector" | "barcodeDetector"> & {
    global?: BarcodeDetectorGlobal;
    barcodeDetector?: BarcodeDetectorLike;
  },
): BarcodeScanner {
  const globalObj = deps.global ?? (globalThis as BarcodeDetectorGlobal);
  const useNative = isBarcodeDetectorAvailable(globalObj);
  const barcodeDetector =
    deps.barcodeDetector ??
    (useNative && globalObj.BarcodeDetector
      ? new globalObj.BarcodeDetector({ formats: ["ean_13", "ean_8"] })
      : undefined);

  return createBrowserBarcodeScanner({
    frameSource: deps.frameSource,
    useNativeDetector: useNative,
    barcodeDetector,
  });
}
