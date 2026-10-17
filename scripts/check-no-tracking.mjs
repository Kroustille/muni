#!/usr/bin/env node
/**
 * FR-024: fail if package.json lists known analytics or third-party tracking packages.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {readonly string[]} */
export const TRACKING_PACKAGES = JSON.parse(
  readFileSync(join(__dirname, "tracking-packages.json"), "utf8"),
);

function isBlockedPackage(name) {
  return TRACKING_PACKAGES.some(
    (blocked) => name === blocked || name.startsWith(`${blocked}/`),
  );
}

/**
 * @param {{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }} packageJson
 * @returns {string[]}
 */
export function findTrackingPackages(packageJson) {
  const names = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  return names.filter(isBlockedPackage).sort();
}

/**
 * @param {string} [rootDir] Project root containing package.json
 */
export function loadPackageJson(rootDir = join(__dirname, "..")) {
  return JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
}

export function main(rootDir) {
  const offenders = findTrackingPackages(loadPackageJson(rootDir));
  if (offenders.length > 0) {
    console.error(
      `Tracking/analytics dependencies are not allowed (FR-024): ${offenders.join(", ")}`,
    );
    process.exit(1);
  }
  console.log("OK: no tracking dependencies in package.json");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
