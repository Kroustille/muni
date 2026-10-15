import { beforeEach, describe, expect, it } from "vitest";
import { createSmtpMailer } from "../../src/adapters/mail/smtp-mailer";
import { t } from "../../src/i18n";

// Mailpit (docker compose service `mailpit`): SMTP on 1025, HTTP API on 8025.
const SMTP_HOST = process.env.SMTP_HOST || "localhost";
const SMTP_PORT = Number(process.env.SMTP_PORT || 1025);
const MAILPIT_API = process.env.MAILPIT_API_URL ?? "http://localhost:8025";
const FROM = "Muni <no-reply@muni.local>";

interface MailpitSummary {
  ID: string;
  Subject: string;
  From: { Name: string; Address: string };
  To: { Address: string }[];
}
interface MailpitMessage {
  Subject: string;
  Text: string;
  HTML: string;
}

async function clearInbox(): Promise<void> {
  await fetch(`${MAILPIT_API}/api/v1/messages`, { method: "DELETE" });
}

async function listMessages(): Promise<MailpitSummary[]> {
  const res = await fetch(`${MAILPIT_API}/api/v1/messages`);
  return ((await res.json()) as { messages: MailpitSummary[] }).messages;
}

async function readMessage(id: string): Promise<MailpitMessage> {
  const res = await fetch(`${MAILPIT_API}/api/v1/message/${id}`);
  return (await res.json()) as MailpitMessage;
}

describe("SMTP Mailer adapter (Mailpit)", () => {
  beforeEach(clearInbox);

  it("delivers the magic link to the recipient with a French subject and body", async () => {
    const mailer = createSmtpMailer({ host: SMTP_HOST, port: SMTP_PORT, from: FROM });
    const link = "http://localhost:3000/auth/verify?token=abc123_-XYZ";

    await mailer.sendMagicLink("ada@example.com", link);

    const messages = await listMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]!.To.map((a) => a.Address)).toEqual(["ada@example.com"]);
    expect(messages[0]!.From.Address).toBe("no-reply@muni.local");
    expect(messages[0]!.Subject).toBe(t("mail.magicLink.subject"));

    const message = await readMessage(messages[0]!.ID);
    expect(message.Text).toContain(link);
    expect(message.Text).toContain(t("mail.magicLink.intro"));
    expect(message.HTML).toContain(link);
  });

  it("surfaces an SMTP failure by rejecting", async () => {
    const mailer = createSmtpMailer({ host: "127.0.0.1", port: 1, from: FROM });

    await expect(
      mailer.sendMagicLink("ada@example.com", "http://localhost:3000/auth/verify?token=x"),
    ).rejects.toThrow();
  });
});
