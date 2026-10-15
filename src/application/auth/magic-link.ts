import type { IdGenerator } from "../ports/id-generator";
import type { MagicLinkTokenRepository } from "../ports/magic-link-token-repository";
import type { Mailer } from "../ports/mailer";
import type { TokenGenerator } from "../ports/token-generator";

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export interface MagicLinkDeps {
  magicLinkTokens: MagicLinkTokenRepository;
  mailer: Mailer;
  tokens: TokenGenerator;
  ids: IdGenerator;
  now: () => Date;
  appUrl: string;
}

export interface MagicLinkUseCases {
  /** Same outcome for known and unknown emails, so accounts cannot be enumerated. */
  requestMagicLink(email: string): Promise<void>;
  /** The verified email for a valid, unexpired, unused token; null otherwise. */
  verifyMagicLink(token: string): Promise<{ email: string } | null>;
}

export function createMagicLinkUseCases(deps: MagicLinkDeps): MagicLinkUseCases {
  const baseUrl = deps.appUrl.replace(/\/+$/, "");

  return {
    async requestMagicLink(email) {
      const normalized = email.trim().toLowerCase();
      const token = deps.tokens.generate();
      await deps.magicLinkTokens.create({
        id: deps.ids.newId(),
        email: normalized,
        tokenHash: deps.tokens.hash(token),
        expiresAt: new Date(deps.now().getTime() + MAGIC_LINK_TTL_MS),
        consumedAt: null,
      });
      await deps.mailer.sendMagicLink(
        normalized,
        `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}`,
      );
    },

    async verifyMagicLink(token) {
      if (token === "") return null;
      return deps.magicLinkTokens.consume(deps.tokens.hash(token), deps.now());
    },
  };
}
