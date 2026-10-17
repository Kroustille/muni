import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

const TRACKING_PACKAGES = JSON.parse(
  readFileSync(join(process.cwd(), "scripts/tracking-packages.json"), "utf8"),
) as string[];

function findTrackingPackages(pkg: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): string[] {
  const names = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];
  return names
    .filter((name) =>
      TRACKING_PACKAGES.some(
        (blocked) => name === blocked || name.startsWith(`${blocked}/`),
      ),
    )
    .sort();
}

describe("no tracking dependencies (FR-024)", () => {
  it("passes on the committed package.json", () => {
    expect(findTrackingPackages(packageJson)).toEqual([]);
  });

  it("flags known analytics or tracking packages", () => {
    const withTracking = {
      dependencies: { "posthog-js": "^1.0.0", zod: "^4.0.0" },
      devDependencies: { "@vercel/analytics": "^1.0.0" },
    };
    expect(findTrackingPackages(withTracking)).toEqual(["@vercel/analytics", "posthog-js"]);
  });
});
