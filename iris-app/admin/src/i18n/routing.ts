import { DEFAULT_LANDING_LOCALE, type LandingLocale } from "./types";

/** Stable section anchors — language-agnostic for deep links. */
export const LANDING_SECTIONS = {
  howItWorks: "how-it-works",
  features: "features",
  trust: "trust",
  pricing: "implementacao",
  faq: "faq",
  contact: "contact",
} as const;

export function landingHomePath(locale: LandingLocale): string {
  return locale === DEFAULT_LANDING_LOCALE ? "/" : `/${locale}`;
}

export function parseLandingLocaleFromPath(
  pathname: string,
): LandingLocale | null {
  if (pathname === "/" || pathname === "") {
    return DEFAULT_LANDING_LOCALE;
  }

  if (pathname === "/en" || pathname === "/en/") {
    return "en";
  }

  return null;
}

export function isLandingPath(pathname: string): boolean {
  return parseLandingLocaleFromPath(pathname) !== null;
}
