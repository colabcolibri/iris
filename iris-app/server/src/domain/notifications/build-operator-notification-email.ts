import {
  emailMetaList,
  emailMuted,
  emailParagraphs,
  escapeHtml,
  renderIrisEmailHtml,
} from "../email/email-html.ts";
import { getOperatorNotificationEmailMessages } from "../../i18n/email/operator-notification/index.ts";
import {
  localeToEmailLang,
  type ServerAppLocale,
} from "../../i18n/locale.ts";
import type { OperatorNotificationEvent } from "./operator-notification-types.ts";

function formatMessageTimestamp(
  value: string | null | undefined,
  locale: ServerAppLocale,
): string {
  const messages = getOperatorNotificationEmailMessages(locale);
  if (!value) {
    return messages.unknownTime;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(localeToEmailLang(locale), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function participantLabel(
  event: OperatorNotificationEvent,
  locale: ServerAppLocale,
): string {
  if (event.participantDisplayName?.trim()) {
    return event.participantDisplayName.trim();
  }
  if (event.participantUsername?.trim()) {
    return `@${event.participantUsername.trim().replace(/^@+/, "")}`;
  }
  return getOperatorNotificationEmailMessages(locale).defaultParticipant;
}

export function emailChatMessageCard(
  event: OperatorNotificationEvent,
  locale: ServerAppLocale,
): string {
  const author = escapeHtml(participantLabel(event, locale));
  const timestamp = escapeHtml(formatMessageTimestamp(event.messageTimestamp, locale));
  const body = escapeHtml(event.inboundMessageText?.trim() || event.customerSummary).replaceAll(
    "\n",
    "<br />",
  );

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr>
    <td style="background-color:#f4f2ee;border:1px solid #d8d2c8;border-radius:14px;padding:14px 16px;">
      <p style="margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.4;color:#6f6860;">
        <span style="font-weight:600;color:#1a1814;">${author}</span>
        <span style="margin:0 6px;">·</span>
        <span>${timestamp}</span>
      </p>
      <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#4a443c;">${body}</p>
    </td>
  </tr>
</table>`.trim();
}

export function buildOperatorNotificationEmailContent(
  event: OperatorNotificationEvent,
  locale: ServerAppLocale = "pt",
): { subject: string; text: string; html: string } {
  const messages = getOperatorNotificationEmailMessages(locale);
  const lang = localeToEmailLang(locale);
  const participant = participantLabel(event, locale);
  const timestampLabel = formatMessageTimestamp(event.messageTimestamp, locale);
  const inboundText = event.inboundMessageText?.trim() || event.customerSummary;
  const subject = messages.subject(event.urgency);

  const textLines = [
    messages.intro,
    "",
    `${messages.urgencyLabel}: ${event.urgency}`,
    `${messages.reasonLabel}: ${event.reason}`,
    `${messages.summaryLabel}: ${event.customerSummary}`,
    "",
    `${participant} · ${timestampLabel}`,
    inboundText,
    "",
    event.suggestedNextStep
      ? `${messages.suggestedNextStepLabel}: ${event.suggestedNextStep}`
      : null,
    event.adminDeepLink ? `Admin: ${event.adminDeepLink}` : null,
  ].filter(Boolean);

  const bodyHtml = [
    emailMuted(messages.intro),
    emailParagraphs(event.reason),
    emailParagraphs(event.customerSummary),
    emailChatMessageCard(event, locale),
    emailMetaList([
      {
        label: messages.urgencyLabel,
        value: event.urgency,
      },
      event.supportIntent
        ? {
            label: messages.supportIntentLabel,
            value: event.supportIntent,
          }
        : null,
      event.participantUsername
        ? {
            label: messages.participantLabel,
            value: `@${event.participantUsername.replace(/^@+/, "")}`,
          }
        : null,
    ].filter((row): row is { label: string; value: string } => row !== null)),
    event.suggestedNextStep
      ? emailParagraphs(`${messages.suggestedNextStepLabel}: ${event.suggestedNextStep}`)
      : "",
    event.adminDeepLink
      ? emailParagraphs(`${messages.openInIrisLabel}: ${event.adminDeepLink}`)
      : "",
  ].join("");

  const html = renderIrisEmailHtml({
    lang,
    heading: messages.heading,
    preheader: event.customerSummary.slice(0, 120),
    bodyHtml,
  });

  return {
    subject,
    text: textLines.join("\n"),
    html,
  };
}
