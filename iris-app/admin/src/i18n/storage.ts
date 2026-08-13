import {
  DEFAULT_APP_LOCALE,
  parseAppLocale,
  type AppLocale,
} from "@/i18n/types";

const STORAGE_KEY = "iris-locale";

export function readStoredAppLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_APP_LOCALE;
  return parseAppLocale(window.localStorage.getItem(STORAGE_KEY));
}

export function writeStoredAppLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}
