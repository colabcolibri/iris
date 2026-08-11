import type { EmailSender, SendEmailResult } from "../../ports/email-sender.ts";

export function createNoopEmailSender(): EmailSender {
  return {
    async send(): Promise<SendEmailResult> {
      return { ok: true };
    },
  };
}
