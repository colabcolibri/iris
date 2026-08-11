import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailSender, SendEmailInput, SendEmailResult } from "../../ports/email-sender.ts";
import { resolveSmtpConfig, type SmtpConfig } from "./smtp-config.ts";

export function createSmtpTransport(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user ? { auth: { user: config.user, pass: config.pass ?? "" } } : {}),
  });
}

export type SmtpEmailSenderOptions = {
  transport?: Transporter;
  defaultFrom?: string;
};

export function createSmtpEmailSender(
  options: SmtpEmailSenderOptions = {},
): EmailSender {
  const transport = options.transport ?? createSmtpTransport(resolveSmtpConfig());
  const defaultFrom = options.defaultFrom ?? process.env.IRIS_FROM_EMAIL?.trim() ?? "Iris <noreply@localhost>";

  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      try {
        await transport.sendMail({
          from: input.from ?? defaultFrom,
          to: input.to.trim(),
          subject: input.subject,
          text: input.text,
          html: input.html,
          ...(input.replyTo ? { replyTo: input.replyTo.trim() } : {}),
        });

        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: message.slice(0, 500) };
      }
    },
  };
}
