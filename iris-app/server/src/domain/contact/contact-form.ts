import type { EmailSender } from "../../ports/email-sender.ts";
import { ErrorCodes } from "../errors/error-codes.ts";
import type { ServerAppLocale } from "../../i18n/locale.ts";
import { getContactEmailMessages } from "../../i18n/email/contact/index.ts";
import { buildContactFormEmailContent } from "./contact-form-email.ts";

const EMAIL_RE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const MAX_NAME = 120;
const MAX_SUBJECT = 200;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

export type ContactFormInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  pageUrl?: string;
  website?: string;
  locale?: string;
};

export type ContactFormErrorCode =
  | "invalid_name"
  | "invalid_email"
  | "invalid_subject"
  | "invalid_message"
  | "email_failed"
  | "email_not_configured";

export class ContactFormError extends Error {
  readonly code: ContactFormErrorCode;
  readonly apiCode: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ContactFormErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ContactFormError";
    this.code = code;
    this.apiCode = ErrorCodes.CONTACT_INVALID;
    this.details = { field: code.replace(/^invalid_/, ""), ...details };
  }
}

export type ContactFormDeps = {
  emailSender: EmailSender;
  destinationEmail?: string;
  locale?: ServerAppLocale;
};

export function resolveContactDestinationEmail(): string {
  return (
    process.env.IRIS_CONTACT_EMAIL?.trim().toLowerCase() ||
    "ola@sergioluciano.com"
  );
}

export function isContactHoneypotTriggered(website: string | undefined): boolean {
  return typeof website === "string" && website.trim().length > 0;
}

export function validateContactFormInput(raw: ContactFormInput): ContactFormInput {
  const name = raw.name.trim();
  const email = raw.email.trim().toLowerCase();
  const subject = raw.subject.trim();
  const message = raw.message.trim();
  const pageUrl = raw.pageUrl?.trim();

  if (!name || name.length > MAX_NAME) {
    throw new ContactFormError("invalid_name", "invalid_name");
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new ContactFormError("invalid_email", "invalid_email");
  }
  if (!subject || subject.length > MAX_SUBJECT) {
    throw new ContactFormError("invalid_subject", "invalid_subject");
  }
  if (!message || message.length < MIN_MESSAGE || message.length > MAX_MESSAGE) {
    throw new ContactFormError("invalid_message", "invalid_message");
  }

  return { name, email, subject, message, pageUrl };
}

export async function submitContactForm(
  raw: ContactFormInput,
  deps: ContactFormDeps,
): Promise<{ ok: true; message: string }> {
  const locale = deps.locale ?? "pt";
  const messages = getContactEmailMessages(locale);

  if (isContactHoneypotTriggered(raw.website)) {
    return {
      ok: true,
      message: messages.successMessage,
    };
  }

  const input = validateContactFormInput(raw);
  const destination = deps.destinationEmail?.trim().toLowerCase() || resolveContactDestinationEmail();

  if (!destination.includes("@")) {
    throw new ContactFormError(
      "email_not_configured",
      "email_not_configured",
      { reason: "email_not_configured" },
    );
  }

  const content = buildContactFormEmailContent({ ...input, locale });
  const result = await deps.emailSender.send({
    to: destination,
    subject: content.subject,
    text: content.text,
    html: content.html,
    replyTo: input.email,
  });

  if (!result.ok) {
    throw new ContactFormError(
      "email_failed",
      "email_failed",
      { reason: "email_failed" },
    );
  }

  return {
    ok: true,
    message: messages.successMessage,
  };
}
