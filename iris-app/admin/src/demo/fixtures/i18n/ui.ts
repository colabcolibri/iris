import type { DemoLocale } from "@/demo/locale";
import { demoContentEn } from "@/i18n/domains/demo-content/en";
import { demoContentPt } from "@/i18n/domains/demo-content/pt";

export type DemoUiMessages = typeof demoContentPt.ui;

export function getDemoUiMessages(locale: DemoLocale): DemoUiMessages {
  return locale === "en" ? demoContentEn.ui : demoContentPt.ui;
}
