"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { t } from "@/i18n";
import type { ThemePreference } from "@/components/theme/theme-preference";

const OPTIONS: { value: ThemePreference; labelKey: "settings.theme.light" | "settings.theme.dark" | "settings.theme.system" }[] =
  [
    { value: "light", labelKey: "settings.theme.light" },
    { value: "dark", labelKey: "settings.theme.dark" },
    { value: "system", labelKey: "settings.theme.system" },
  ];

export function ThemeAppearanceSetting() {
  const { theme, setTheme } = useTheme();

  return (
    <section aria-labelledby="settings-appearance-heading">
      <h2 id="settings-appearance-heading" className="mb-2 text-sm font-medium text-muted">
        {t("settings.appearance")}
      </h2>
      <div
        className="flex rounded-xl border border-border bg-surface p-1"
        role="group"
        aria-label={t("settings.appearance")}
      >
        {OPTIONS.map(({ value, labelKey }) => {
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(value)}
              className={`min-h-11 flex-1 rounded-lg px-2 text-sm font-medium transition-colors ${
                selected ? "bg-accent text-accent-foreground" : "text-foreground"
              }`}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
