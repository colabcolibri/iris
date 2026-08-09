import type { EmailSender, SendEmailInput, SendEmailResult } from "../../ports/email-sender.ts";

export type ResendEmailSenderOptions = {
  apiKey: string;
  defaultFrom: string;
  fetchImpl?: typeof fetch;
};

export function createResendEmailSender(
  options: ResendEmailSenderOptions,
): EmailSender {
  const fetchFn = options.fetchImpl ?? fetch;

  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      const response = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: input.from ?? options.defaultFrom,
          to: [input.to.trim()],
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          ok: false,
          error: errorText.slice(0, 500) || `Resend failed (${response.status})`,
        };
      }

      return { ok: true };
    },
  };
}
