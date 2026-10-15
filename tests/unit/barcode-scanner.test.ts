import { describe, expect, it, vi } from "vitest";

import {
  createBrowserBarcodeScanner,
  type BarcodeFrameSource,
  type BarcodeScanFrame,
} from "@/adapters/browser/barcode-scanner";

function frameSource(frames: BarcodeScanFrame[]): BarcodeFrameSource {
  return {
    async *frames() {
      for (const frame of frames) {
        yield frame;
      }
    },
  };
}

describe("Browser BarcodeScanner adapter", () => {
  it("prefers native BarcodeDetector when enabled", async () => {
    const detect = vi.fn(async () => [{ rawValue: "9782070368228" }]);
    const scanWithWasm = vi.fn(async () => "should-not-run");

    const scanner = createBrowserBarcodeScanner({
      frameSource: frameSource([
        {
          detectWithNative: async (detector) => {
            const results = await detector.detect({});
            return results[0]?.rawValue ?? null;
          },
          scanWithWasm,
        },
      ]),
      useNativeDetector: true,
      barcodeDetector: { detect },
    });

    const seen: string[] = [];
    await scanner.scanContinuous((isbn) => seen.push(isbn));
    expect(seen).toEqual(["9782070368228"]);
    expect(detect).toHaveBeenCalledOnce();
    expect(scanWithWasm).not.toHaveBeenCalled();
  });

  it("falls back to WASM when native detection finds nothing", async () => {
    const detect = vi.fn(async () => []);
    const scanWithWasm = vi.fn(async () => "9780000000000");

    const scanner = createBrowserBarcodeScanner({
      frameSource: frameSource([
        {
          detectWithNative: async (detector) => {
            const results = await detector.detect({});
            return results[0]?.rawValue ?? null;
          },
          scanWithWasm,
        },
      ]),
      useNativeDetector: true,
      barcodeDetector: { detect },
    });

    const seen: string[] = [];
    await scanner.scanContinuous((isbn) => seen.push(isbn));
    expect(seen).toEqual(["9780000000000"]);
    expect(scanWithWasm).toHaveBeenCalledOnce();
  });

  it("uses WASM only when native path is disabled", async () => {
    const scanWithWasm = vi.fn(async () => "9781111111111");
    const scanner = createBrowserBarcodeScanner({
      frameSource: frameSource([{ scanWithWasm }]),
      useNativeDetector: false,
    });

    const seen: string[] = [];
    await scanner.scanContinuous((isbn) => seen.push(isbn));
    expect(seen).toEqual(["9781111111111"]);
  });

  it("scans continuously until a frame yields an ISBN", async () => {
    const scanWithWasm = vi
      .fn<BarcodeScanFrame["scanWithWasm"]>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("9782222222222");

    const scanner = createBrowserBarcodeScanner({
      frameSource: frameSource([{ scanWithWasm }, { scanWithWasm }]),
      useNativeDetector: false,
    });

    const seen: string[] = [];
    await scanner.scanContinuous((isbn) => seen.push(isbn));
    expect(seen).toEqual(["9782222222222"]);
    expect(scanWithWasm).toHaveBeenCalledTimes(2);
  });

  it("stop() ends scanning without invoking the callback", async () => {
    let scanner: ReturnType<typeof createBrowserBarcodeScanner>;
    const scanWithWasm = vi.fn(async () => {
      scanner.stop();
      return null;
    });
    scanner = createBrowserBarcodeScanner({
      frameSource: frameSource([{ scanWithWasm }, { scanWithWasm: async () => "9783333333333" }]),
      useNativeDetector: false,
    });

    const seen: string[] = [];
    await scanner.scanContinuous((isbn) => seen.push(isbn));
    expect(seen).toEqual([]);
    expect(scanWithWasm).toHaveBeenCalledOnce();
  });
});
