import nodemailer from "nodemailer";

import type { Mailer } from "../../application/ports/mailer";

/** Kept in sync with `src/i18n/fr.json` (`mail.magicLink.*`); adapters cannot import i18n. */
const MAGIC_LINK_SUBJECT = "Votre lien de connexion à Muni";
const MAGIC_LINK_INTRO =
  "Voici votre lien de connexion à Muni. Il est valable 15 minutes et ne peut servir qu'une fois.";

export interface SmtpMailerOptions {
  host: string;
  port: number;
  from: string;
  user?: string;
  password?: string;
}

export function createSmtpMailer(options: SmtpMailerOptions): Mailer {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: false,
    auth:
      options.user !== undefined
        ? { user: options.user, pass: options.password ?? "" }
        : undefined,
  });

  return {
    async sendMagicLink(email, link) {
      const intro = MAGIC_LINK_INTRO;
      const subject = MAGIC_LINK_SUBJECT;
      await transport.sendMail({
        from: options.from,
        to: email,
        subject,
        text: `${intro}\n\n${link}`,
        html: `<p>${intro}</p><p><a href="${link}">${link}</a></p>`,
      });
    },
  };
}
