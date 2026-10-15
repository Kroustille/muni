import { createHttpAuthGateway } from "@/adapters/http/auth-gateway";
import type { AuthGateway } from "@/application/ports/auth-gateway";

let gateway: AuthGateway | undefined;

/** Browser HTTP auth gateway for screens that are not yet wired through `client.ts`. */
export function getHttpAuthGateway(): AuthGateway {
  gateway ??= createHttpAuthGateway({
    fetch: globalThis.fetch.bind(globalThis),
    baseUrl: "",
    navigate: (url) => {
      window.location.assign(url);
    },
  });
  return gateway;
}
