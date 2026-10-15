export interface BarcodeScanner {
  /** Continuously scan frames until `stop()`; invokes callback with a raw ISBN string. */
  scanContinuous(callback: (isbn: string) => void): Promise<void>;
  stop(): void;
}
