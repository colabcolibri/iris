import type { ServerAppLocale } from "../../i18n/locale.ts";
import { localeToEmailLang } from "../../i18n/locale.ts";
import { getLoginEmailMessages } from "../../i18n/email/login/index.ts";
import {
  emailCodeBlock,
  emailMuted,
  emailParagraphs,
  renderIrisEmailHtml,
} from "../email/email-html.ts";

export function buildAdminLoginEmailContent(input: {
  code: string;
  ttlMinutes: number;
  locale?: ServerAppLocale;
}): { subject: string; text: string; html: string } {
  const locale = input.locale ?? "pt";
  const messages = getLoginEmailMessages(locale);
  const lang = localeToEmailLang(locale);

  const subject = messages.subject;
  const text = [
    messages.textIntro,
    "",
    input.code,
    "",
    messages.textExpires(input.ttlMinutes),
    messages.textIgnore,
  ].join("\n");

  const html = renderIrisEmailHtml({
    lang,
    heading: messages.heading,
    preheader: messages.preheader(input.code, input.ttlMinutes),
    bodyHtml: [
      emailParagraphs(messages.intro),
      emailCodeBlock(input.code),
      emailMuted(messages.expires(input.ttlMinutes)),
      emailMuted(messages.ignore),
    ].join(""),
  });

  return { subject, text, html };
}
