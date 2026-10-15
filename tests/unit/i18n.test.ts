import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import fr from "@/i18n/fr.json";
import { t, type MessageKey } from "@/i18n";

const catalog: Record<string, unknown> = fr;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("i18n catalog", () => {
  it("is a flat, non-empty map of string keys to non-empty strings", () => {
    const entries = Object.entries(catalog);
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, value] of entries) {
      expect(key.trim(), "empty key").not.toBe("");
      expect(typeof value, `value of ${key}`).toBe("string");
      expect((value as string).trim(), `value of ${key}`).not.toBe("");
    }
  });
});

describe("t()", () => {
  it("resolves every catalog key to its French message", () => {
    for (const key of Object.keys(catalog)) {
      expect(t(key as MessageKey)).toBe(catalog[key]);
    }
  });

  it("only accepts catalog keys at compile time", () => {
    const keys: MessageKey[] = Object.keys(catalog) as MessageKey[];
    expect(keys.length).toBeGreaterThan(0);
    // @ts-expect-error unknown keys are rejected by the type system
    const invalid: MessageKey = "this.key.does.not.exist";
    expect(Object.keys(catalog)).not.toContain(invalid);
  });
});

describe("keys referenced in src", () => {
  it("all exist in fr.json", () => {
    const missing: string[] = [];
    for (const file of sourceFiles(join(process.cwd(), "src"))) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(/\bt\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) {
        if (!(match[1] in catalog)) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
