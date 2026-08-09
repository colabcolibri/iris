import type { EmailSender, SendEmailInput, SendEmailResult } from "../../ports/email-sender.ts";

export function createLoggingEmailSender(): EmailSender {
  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      console.log(
        `[iris-email] to=${input.to} subject=${input.subject}\n${input.text}`,
      );
      return { ok: true };
    },
  };
}
