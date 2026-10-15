import { createHash, randomBytes } from "node:crypto";

import type { TokenGenerator } from "../../application/ports/token-generator";

export function createTokenGenerator(): TokenGenerator {
  return {
    generate() {
      return randomBytes(32).toString("base64url");
    },
    hash(token) {
      return createHash("sha256").update(token).digest("hex");
    },
  };
}
