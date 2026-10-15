export interface TokenGenerator {
  /** Cryptographically secure opaque token. */
  generate(): string;
  /** Deterministic hash of a token; only hashes are stored. */
  hash(token: string): string;
}
