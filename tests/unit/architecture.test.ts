import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");
const SERVER_ADAPTERS = ["postgres", "mail", "google", "node"];
const SERVER_PACKAGES = ["pg", "kysely", "nodemailer", "openid-client"];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts") ? [full] : [];
  });
}

function importSpecifiers(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const found: string[] = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\sfrom\s*)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) found.push(match[1]);
  }
  return found;
}

/** Resolves an internal specifier to a posix path relative to src, or null for external packages. */
function resolveInternal(fromFile: string, specifier: string): string | null {
  let target: string;
  if (specifier.startsWith("@/")) target = specifier.slice(2);
  else if (specifier.startsWith("."))
    target = relative(SRC, normalize(join(dirname(fromFile), specifier)));
  else return null;
  return target
    .split(sep)
    .join("/")
    .replace(/\/index$/, "");
}

function packageName(specifier: string): string {
  if (specifier.startsWith("node:")) return "node:";
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const under = (path: string, folder: string) => path === folder || path.startsWith(`${folder}/`);
const layerOf = (file: string) => file.split("/")[0];

/** Returns a violation message for one import, or null when allowed. `file` is posix, relative to src. */
export function checkImport(
  file: string,
  specifier: string,
  resolved: string | null,
): string | null {
  const layer = layerOf(file);
  const external = resolved === null;
  const pkg = external ? packageName(specifier) : "";
  const isServerPackage = external && (pkg === "node:" || SERVER_PACKAGES.includes(pkg));

  if (!external && under(resolved, "adapters")) {
    const adapter = resolved.split("/")[1];
    if (layer === "adapters") {
      return file.split("/")[1] === adapter
        ? null
        : `adapter imports another adapter (${resolved})`;
    }
    if (layer !== "composition") return `only src/composition may import adapters (${resolved})`;
    if (SERVER_ADAPTERS.includes(adapter) && file !== "composition/server.ts") {
      return `server adapter ${adapter} may only be imported by src/composition/server.ts`;
    }
    return null;
  }

  switch (layer) {
    case "domain":
      if (external) return pkg === "zod" ? null : `domain must not import external package ${pkg}`;
      return under(resolved, "domain") ? null : `domain must not import ${resolved}`;
    case "application":
      if (external)
        return pkg === "zod" ? null : `application must not import external package ${pkg}`;
      return under(resolved, "domain") || under(resolved, "application")
        ? null
        : `application may import only domain and application (${resolved})`;
    case "adapters": {
      const adapter = file.split("/")[1];
      if (external) {
        return isServerPackage && !SERVER_ADAPTERS.includes(adapter)
          ? `client adapter ${adapter} must not import ${pkg}`
          : null;
      }
      return under(resolved, "domain") || under(resolved, "application/ports")
        ? null
        : `adapters may import only domain and application/ports (${resolved})`;
    }
    case "app":
    case "components":
      if (isServerPackage) return `UI must not import server package ${pkg}`;
      return external ||
        ["domain", "application", "composition", "i18n", "components", "app"].some((l) =>
          under(resolved, l),
        )
        ? null
        : `UI may not import ${resolved}`;
    case "composition":
      return null;
    case "i18n":
      return external || under(resolved, "i18n") ? null : `i18n must not import ${resolved}`;
    default:
      return null;
  }
}

describe("architecture checker", () => {
  const check = (file: string, spec: string) =>
    checkImport(file, spec, resolveInternal(join(SRC, file), spec));

  it("rejects domain importing application or infrastructure", () => {
    expect(check("domain/a.ts", "../application/items")).not.toBeNull();
    expect(check("domain/a.ts", "pg")).not.toBeNull();
    expect(check("domain/a.ts", "zod")).toBeNull();
    expect(check("domain/a.ts", "./clock")).toBeNull();
  });

  it("restricts application to domain and application", () => {
    expect(check("application/items.ts", "@/adapters/indexeddb/repo")).not.toBeNull();
    expect(check("application/items.ts", "../composition/client")).not.toBeNull();
    expect(check("application/items.ts", "./ports/item-repository")).toBeNull();
    expect(check("application/items.ts", "../domain/item")).toBeNull();
  });

  it("restricts adapters to ports and domain", () => {
    expect(check("adapters/http/x.ts", "../../application/items")).not.toBeNull();
    expect(check("adapters/http/x.ts", "../postgres/db")).not.toBeNull();
    expect(check("adapters/http/x.ts", "../../application/ports/remote-store")).toBeNull();
    expect(check("adapters/http/x.ts", "pg")).not.toBeNull();
    expect(check("adapters/postgres/x.ts", "kysely")).toBeNull();
  });

  it("forbids UI from importing adapters and server packages", () => {
    expect(check("app/page.tsx", "@/adapters/http/x")).not.toBeNull();
    expect(check("components/a.tsx", "../adapters/browser/x")).not.toBeNull();
    expect(check("app/page.tsx", "@/composition/client")).toBeNull();
  });

  it("allows server adapters only from composition/server.ts", () => {
    expect(check("composition/client.ts", "@/adapters/postgres/db")).not.toBeNull();
    expect(check("composition/client.ts", "@/adapters/indexeddb/repo")).toBeNull();
    expect(check("composition/server.ts", "@/adapters/postgres/db")).toBeNull();
    expect(check("composition/server.ts", "@/adapters/mail/smtp")).toBeNull();
  });
});

describe("dependency rule over src", () => {
  const files = listSourceFiles(SRC);

  it("scans source files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("has no import violating the dependency rule", () => {
    const violations: string[] = [];
    for (const absolute of files) {
      const file = relative(SRC, absolute).split(sep).join("/");
      for (const specifier of importSpecifiers(readFileSync(absolute, "utf8"))) {
        const message = checkImport(file, specifier, resolveInternal(absolute, specifier));
        if (message) violations.push(`${file} -> ${specifier}: ${message}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
