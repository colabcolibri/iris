import type { EmailSender } from "../../ports/email-sender.ts";
import { createLoggingEmailSender } from "./logging-email-sender.ts";
import { createNoopEmailSender } from "./noop-email-sender.ts";
import { createResendEmailSender } from "./resend-email-sender.ts";

export type EmailProvider = "resend" | "logging" | "noop";

function isNodeTestRunner(): boolean {
  return process.env.NODE_TEST_CONTEXT != null;
}

export function resolveEmailProvider(): EmailProvider {
  const raw = process.env.IRIS_EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === "resend" || raw === "logging" || raw === "noop") {
    return raw;
  }
  if (isNodeTestRunner()) {
    return "noop";
  }
  return "logging";
}

export function createEmailSenderFromEnv(): EmailSender {
  const provider = resolveEmailProvider();
  const from = process.env.IRIS_FROM_EMAIL?.trim() || "Iris <noreply@localhost>";

  switch (provider) {
    case "resend": {
      const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
      if (!apiKey) {
        throw new Error("RESEND_API_KEY is required when IRIS_EMAIL_PROVIDER=resend");
      }
      return createResendEmailSender({ apiKey, defaultFrom: from });
    }
    case "logging":
      return createLoggingEmailSender();
    default:
      return createNoopEmailSender();
  }
}
