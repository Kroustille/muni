export interface Mailer {
  /** Sends the sign-in email. Rejects when delivery fails. */
  sendMagicLink(email: string, link: string): Promise<void>;
}
