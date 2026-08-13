/** Locales supported across admin, landing and demo. */
export type AppLocale = "pt" | "en";

/** @deprecated Use AppLocale */
export type LandingLocale = AppLocale;

export const APP_LOCALES = ["pt", "en"] as const satisfies readonly AppLocale[];

export const DEFAULT_APP_LOCALE: AppLocale = "pt";

/** @deprecated Use APP_LOCALES */
export const LANDING_LOCALES = APP_LOCALES;

/** @deprecated Use DEFAULT_APP_LOCALE */
export const DEFAULT_LANDING_LOCALE = DEFAULT_APP_LOCALE;

export type Bcp47Locale = "pt-BR" | "en-US";

export function localeToBcp47(locale: AppLocale): Bcp47Locale {
  return locale === "en" ? "en-US" : "pt-BR";
}

export function bcp47ToAppLocale(bcp47: string): AppLocale {
  return bcp47.toLowerCase().startsWith("en") ? "en" : "pt";
}

export function parseAppLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : DEFAULT_APP_LOCALE;
}
