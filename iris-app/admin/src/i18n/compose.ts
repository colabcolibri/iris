import type { AppLocale } from "@/i18n/types";
import { shellEn } from "@/i18n/domains/shell/en";
import { shellPt } from "@/i18n/domains/shell/pt";
import type { ShellMessages } from "@/i18n/domains/shell/types";
import { labelsEn } from "@/i18n/domains/labels/en";
import { labelsPt } from "@/i18n/domains/labels/pt";
import type { LabelsMessages } from "@/i18n/domains/labels/types";
import { serverErrorsEn } from "@/i18n/domains/server-errors/en";
import { serverErrorsPt } from "@/i18n/domains/server-errors/pt";
import type { ServerErrorsMessages } from "@/i18n/domains/server-errors/types";

export type I18nDomainId = "shell" | "labels" | "serverErrors";

export type DomainMessagesMap = {
  shell: ShellMessages;
  labels: LabelsMessages;
  serverErrors: ServerErrorsMessages;
};

const PT_DOMAINS: DomainMessagesMap = {
  shell: shellPt,
  labels: labelsPt,
  serverErrors: serverErrorsPt,
};

const EN_DOMAINS: DomainMessagesMap = {
  shell: shellEn,
  labels: labelsEn,
  serverErrors: serverErrorsEn,
};

export function getDomainMessages<D extends I18nDomainId>(
  domain: D,
  locale: AppLocale,
): DomainMessagesMap[D] {
  const table = locale === "en" ? EN_DOMAINS : PT_DOMAINS;
  return table[domain];
}

export function getAllDomainMessages(locale: AppLocale): DomainMessagesMap {
  return locale === "en" ? EN_DOMAINS : PT_DOMAINS;
}

export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? `{${key}}`),
  );
}
