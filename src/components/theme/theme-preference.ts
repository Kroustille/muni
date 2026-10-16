export const THEME_STORAGE_KEY = "muni-theme";

export type ThemePreference = "light" | "dark" | "system";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    /* private mode / disabled storage */
  }
  return "system";
}

export function applyThemeToDocument(theme: ThemePreference): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "light") root.classList.add("light");
  else if (theme === "dark") root.classList.add("dark");
}

export const themeInitScript = `(function(){try{var k="muni-theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")return;var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);}catch(e){}})();`;
