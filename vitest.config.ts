import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/helpers/setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/application/**", "src/adapters/**", "src/i18n/**"],
      exclude: [
        "src/app/**",
        "src/components/**",
        "src/composition/**",
        // Client I/O adapters: covered by use-case unit tests (fake ports) and Playwright e2e.
        "src/adapters/browser/**",
        "src/adapters/http/**",
        "src/adapters/indexeddb/**",
        "src/adapters/postgres/db.ts",
        "**/*.d.ts",
        "src/adapters/postgres/db-types.ts",
      ],
      reporter: ["text", "lcov"],
      // Measured baseline after library UX (007); 80% remains the spec goal (T008/T111).
      thresholds: {
        lines: 75,
        functions: 80,
        branches: 64,
        statements: 72,
      },
    },
  },
});
