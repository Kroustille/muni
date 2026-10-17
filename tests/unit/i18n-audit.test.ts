import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const SCAN_ROOTS = [
  join(PROJECT_ROOT, "src/components"),
  join(PROJECT_ROOT, "src/app"),
];

const USER_FACING_ATTRS = ["aria-label", "placeholder", "title", "label"] as const;

const CODE_LINE =
  /\b(useState|useRef|useMemo|useCallback|useEffect|Promise|typeof|return\s*\(|case\s+["']|void\s*\||\?\s*\(|:\s*\()/u;

function collectTsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return collectTsxFiles(path);
    return name.endsWith(".tsx") ? [path] : [];
  });
}

function isAllowedLiteral(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^\{.*\}$/u.test(trimmed)) return true;
  if (/^https?:\/\//u.test(trimmed)) return true;
  if (/^[0-9./:\s-]+$/u.test(trimmed)) return true;
  if (/^[a-z][a-z0-9]*(?:[-_/][a-z0-9]+)*$/iu.test(trimmed)) return true;
  if (trimmed === "×") return true;
  if (/[()=>]|!==|&&|\|\||\bonChange\b|\bsetValues\b|\bupdate\w+/iu.test(trimmed)) return true;
  return false;
}

function findViolations(filePath: string, source: string): string[] {
  const rel = relative(PROJECT_ROOT, filePath).replaceAll("\\", "/");
  const violations: string[] = [];

  const lines = source.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    if (CODE_LINE.test(line)) continue;
    if (/\bt\s*\(/u.test(line)) continue;

    for (const attr of USER_FACING_ATTRS) {
      const attrRe = new RegExp(`${attr}=["']([^"']+)["']`, "u");
      const match = attrRe.exec(line);
      if (match && !isAllowedLiteral(match[1]!)) {
        violations.push(`${rel}:${index + 1} ${attr}="${match[1]}"`);
      }
    }

    const jsxTextSameLine = />\s*([^<>{}]+?)\s*</gu;
    for (const match of line.matchAll(jsxTextSameLine)) {
      const text = match[1]!.trim();
      if (!text || isAllowedLiteral(text)) continue;
      if (/[A-Za-zÀ-ÿÉèêëàâùûôîç]/u.test(text)) {
        violations.push(`${rel}:${index + 1} JSX "${text}"`);
      }
    }

    const jsxTextBeforeExpr = />\s*([^<>{}]+?)\s*\{/gu;
    for (const match of line.matchAll(jsxTextBeforeExpr)) {
      const text = match[1]!.trim();
      if (!text || isAllowedLiteral(text)) continue;
      if (/[A-Za-zÀ-ÿÉèêëàâùûôîç]/u.test(text)) {
        violations.push(`${rel}:${index + 1} JSX "${text}"`);
      }
    }
  }

  return violations;
}

describe("i18n audit (FR-022)", () => {
  it("has no hard-coded user-facing strings in src/components and src/app", () => {
    const offenders: string[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of collectTsxFiles(root)) {
        const source = readFileSync(file, "utf8");
        offenders.push(...findViolations(file, source));
      }
    }
    expect(offenders).toEqual([]);
  });
});
