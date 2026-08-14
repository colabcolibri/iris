import type { AppLocale } from "@/i18n/types";
import {
  readStoredAppLocale,
  writeStoredAppLocale,
} from "@/i18n/storage";

export type DemoLocale = AppLocale;

export const DEMO_LOCALES = ["pt", "en"] as const satisfies readonly DemoLocale[];

export const DEFAULT_DEMO_LOCALE: DemoLocale = "pt";

export function readStoredDemoLocale(): DemoLocale {
  return readStoredAppLocale();
}

export function writeStoredDemoLocale(locale: DemoLocale) {
  writeStoredAppLocale(locale);
}
