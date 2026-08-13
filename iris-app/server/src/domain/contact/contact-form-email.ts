import type { ServerAppLocale } from "../../i18n/locale.ts";
import { localeToEmailLang } from "../../i18n/locale.ts";
import { getContactEmailMessages } from "../../i18n/email/contact/index.ts";
import {
  emailMetaList,
  emailParagraphs,
  emailQuote,
  renderIrisEmailHtml,
} from "../email/email-html.ts";

export function buildContactFormEmailContent(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  pageUrl?: string;
  locale?: ServerAppLocale;
}): { subject: string; text: string; html: string } {
  const locale = input.locale ?? "pt";
  const messages = getContactEmailMessages(locale);
  const lang = localeToEmailLang(locale);

  const lines = [
    messages.textIntro,
    "",
    `${messages.labels.name}: ${input.name}`,
    `${messages.labels.email}: ${input.email}`,
    `${messages.labels.subject}: ${input.subject}`,
  ];

  if (input.pageUrl) {
    lines.push(`${messages.labels.page}: ${input.pageUrl}`);
  }

  lines.push("", messages.textMessageLabel, "", input.message);

  const meta = [
    { label: messages.labels.name, value: input.name },
    { label: messages.labels.email, value: input.email },
    { label: messages.labels.subject, value: input.subject },
  ];
  if (input.pageUrl) {
    meta.push({ label: messages.labels.page, value: input.pageUrl });
  }

  const html = renderIrisEmailHtml({
    lang,
    heading: messages.heading,
    preheader: `${input.name}: ${input.subject}`,
    bodyHtml: [
      emailParagraphs(messages.intro),
      emailMetaList(meta),
      emailParagraphs(messages.messageLabel),
      emailQuote(input.message),
    ].join(""),
    footerNote: messages.footerNote,
  });

  return {
    subject: `${messages.subjectPrefix} ${input.subject}`,
    text: lines.join("\n"),
    html,
  };
}
