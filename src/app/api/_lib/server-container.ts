import { createServerContainer, type ServerContainer } from "@/composition/server";

let cached: ServerContainer | undefined;

export function getServerContainer(): ServerContainer {
  cached ??= createServerContainer();
  return cached;
}

/** Test-only: replace or reset the lazily created container. */
export function resetServerContainer(container?: ServerContainer): void {
  cached = container;
}
