/** Locales supported on the marketing site. Admin app migration comes later. */
export type LandingLocale = "pt" | "en";

export const LANDING_LOCALES = ["pt", "en"] as const satisfies readonly LandingLocale[];

export const DEFAULT_LANDING_LOCALE: LandingLocale = "pt";
