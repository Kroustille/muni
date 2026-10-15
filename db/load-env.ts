import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load `.env` then `.env.local` from the project root (Next.js-style; does not override existing env). */
export function loadLocalEnv(cwd = process.cwd()): void {
  for (const name of [".env", ".env.local"]) {
    loadEnvFile(resolve(cwd, name));
  }
}

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) {
      continue;
    }
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
