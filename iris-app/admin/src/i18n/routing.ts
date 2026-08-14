import { ROUTES } from "@/lib/routes";
import { DEFAULT_LANDING_LOCALE, type AppLocale, type LandingLocale } from "./types";

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

/** Locale fixed by URL on marketing/legal routes; null on admin/demo/login. */
export function parseRouteLocaleFromPath(pathname: string): AppLocale | null {
  const landing = parseLandingLocaleFromPath(pathname);
  if (landing) return landing;

  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === ROUTES.privacy || normalized === "/privacy-policy") {
    return "pt";
  }
  if (normalized === ROUTES.privacyEn) {
    return "en";
  }

  return null;
}
