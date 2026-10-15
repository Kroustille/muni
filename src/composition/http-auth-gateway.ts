import type { AuthGateway } from "@/application/ports/auth-gateway";
import { getAuthGateway } from "@/composition/client";

/** @deprecated Use `getAuthGateway()` from `@/composition/client`. */
export function getHttpAuthGateway(): Promise<AuthGateway> {
  return getAuthGateway();
}
