import type { LandingLocale } from "@/i18n/types";

export type DemoLocale = LandingLocale;

export const DEMO_LOCALES = ["pt", "en"] as const satisfies readonly DemoLocale[];

export const DEFAULT_DEMO_LOCALE: DemoLocale = "pt";

const STORAGE_KEY = "iris-demo-locale";

export function readStoredDemoLocale(): DemoLocale {
  if (typeof window === "undefined") return DEFAULT_DEMO_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : DEFAULT_DEMO_LOCALE;
}

export function writeStoredDemoLocale(locale: DemoLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}
