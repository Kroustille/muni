import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyThemeToDocument,
  isThemePreference,
  readStoredTheme,
  THEME_STORAGE_KEY,
} from "@/components/theme/theme-preference";

describe("theme", () => {
  const storage = new Map<string, string>();
  const classList = {
    classes: new Set<string>(),
    add(...names: string[]) {
      names.forEach((n) => this.classes.add(n));
    },
    remove(...names: string[]) {
      names.forEach((n) => this.classes.delete(n));
    },
    contains(name: string) {
      return this.classes.has(name);
    },
  };

  beforeEach(() => {
    storage.clear();
    classList.classes.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal("document", { documentElement: { classList } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognizes stored theme values", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
  });

  it("defaults to system when storage is empty", () => {
    expect(readStoredTheme()).toBe("system");
  });

  it("reads a stored preference", () => {
    storage.set(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("applies light and dark classes on the document element", () => {
    applyThemeToDocument("light");
    expect(classList.contains("light")).toBe(true);
    expect(classList.contains("dark")).toBe(false);

    applyThemeToDocument("dark");
    expect(classList.contains("dark")).toBe(true);
    expect(classList.contains("light")).toBe(false);

    applyThemeToDocument("system");
    expect(classList.contains("light")).toBe(false);
    expect(classList.contains("dark")).toBe(false);
  });
});
